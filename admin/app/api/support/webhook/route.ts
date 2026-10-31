import { NextRequest, NextResponse } from 'next/server';

const MAKE_SUPPORT_WEBHOOK_URL = process.env.MAKE_SUPPORT_WEBHOOK_URL || process.env.MAKE_AUTOMATION_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    } = body;

    const payload = {
      event,
      role,
      user_id: userId || 'anonymous',
      phone: phone || 'unknown',
      name: name || (role === 'host' ? 'Friendoo Host' : 'Friendoo Caller'),
      scenario: scenario || 'general_help',
      metadata: {
        utr: utr || null,
        amount: amount || null,
        payout_id: payoutId || null,
        ticket_id: ticketId || null,
      },
      chat_summary: chatSummary || 'User requested human assistance.',
      timestamp,
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
      payload,
    });
  } catch (err: unknown) {
    console.error('Error processing support webhook:', err);
    return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 });
  }
}

