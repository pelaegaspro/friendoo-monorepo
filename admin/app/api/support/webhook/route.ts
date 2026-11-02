import { NextRequest, NextResponse } from 'next/server';

const MAKE_SUPPORT_WEBHOOK_URL = process.env.MAKE_SUPPORT_WEBHOOK_URL || process.env.MAKE_AUTOMATION_WEBHOOK_URL;
const SUPPORT_WEBHOOK_SECRET = process.env.SUPPORT_WEBHOOK_SECRET?.trim();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // 1. Enforce payload size limit (max 16KB)
    if (rawBody.length > 16 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // 2. If SUPPORT_WEBHOOK_SECRET is configured, require secret header
    if (SUPPORT_WEBHOOK_SECRET) {
      const authHeader = req.headers.get('x-support-token') || req.headers.get('authorization');
      if (authHeader !== SUPPORT_WEBHOOK_SECRET && authHeader !== `Bearer ${SUPPORT_WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      event = 'support_escalation',
      role = 'user', // 'user' | 'host'
      userId,
      phone,
      name,
      scenario,
      utr,
      amount,
      payoutId,
      chatSummary,
      ticketId,
      timestamp = new Date().toISOString(),
    } = body as Record<string, unknown>;

    // 3. Sanitize fields
    const safeUserId = String(userId || '').slice(0, 64) || 'anonymous';
    const safePhone = String(phone || '').replace(/[^0-9+]/g, '').slice(0, 15) || 'unknown';
    const safeName = String(name || '').slice(0, 80) || (role === 'host' ? 'Friendoo Host' : 'Friendoo Caller');
    const safeScenario = String(scenario || 'general_help').slice(0, 50);
    const safeChatSummary = String(chatSummary || 'User requested human assistance.').slice(0, 1000);

    const payload = {
      event: String(event).slice(0, 50),
      role: role === 'host' ? 'host' : 'user',
      user_id: safeUserId,
      phone: safePhone,
      name: safeName,
      scenario: safeScenario,
      metadata: {
        utr: utr ? String(utr).slice(0, 50) : null,
        amount: typeof amount === 'number' ? amount : null,
        payout_id: payoutId ? String(payoutId).slice(0, 50) : null,
        ticket_id: ticketId ? String(ticketId).slice(0, 50) : null,
      },
      chat_summary: safeChatSummary,
      timestamp: typeof timestamp === 'string' ? timestamp.slice(0, 35) : new Date().toISOString(),
      app: 'Friendoo Live Support Desk',
    };

    let makeWebhookSuccess = false;
    let makeWebhookStatus = 0;

    if (MAKE_SUPPORT_WEBHOOK_URL) {
      try {
        const makeRes = await fetch(MAKE_SUPPORT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        makeWebhookSuccess = makeRes.ok;
        makeWebhookStatus = makeRes.status;
      } catch (webhookErr) {
        console.error('Failed to dispatch Make.com webhook:', webhookErr);
      }
    } else {
      console.warn('MAKE_SUPPORT_WEBHOOK_URL not configured. Running in local audit mode.');
    }

    return NextResponse.json({
      success: true,
      webhookDispatched: makeWebhookSuccess,
      status: makeWebhookStatus,
    });
  } catch (err: unknown) {
    console.error('Error processing support webhook:', err);
    return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 });
  }
}
