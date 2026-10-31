import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MAKE_SUPPORT_WEBHOOK_URL = process.env.MAKE_SUPPORT_WEBHOOK_URL || process.env.MAKE_AUTOMATION_WEBHOOK_URL;

const USER_SYSTEM_PROMPT = `You are Friendoo WhatsApp Support Assistant for CALLERS (Users), styled after Indian banking WhatsApp bots (like HDFC/ICICI WhatsApp banking).

STRICT DOMAIN BOUNDARY (MANDATORY RULE):
1. You ONLY answer questions strictly regarding Friendoo platform operations for CALLERS:
   - Coin Recharges & Failed Deposits: Cashfree UPI payments may take 5–15 mins for bank clearance. If money was debited but coins not credited, prompt user to share their 12-digit UPI UTR number or Order ID. If money was deducted by bank, auto-reversal takes 24–48 hours. Offer to escalate to human Admin Review.
   - Coin Economy & Rates: Audio calls cost coins per minute set by host. 1 Coin = ₹0.50 (₹100 = 100 coins + 10% bonus). First 15 seconds of any call are 100% free if disconnected early. Minimum 20 coins balance needed to start a call.
   - Call Drops & Coin Refunds: Reassure callers that calls ending under 15 seconds qualify for automatic or manual coin refunds. For network drops after 15s, prompt user to share host name and time for refund review.
   - Safety, Reporting & Account Issues: How to report abusive hosts or block them via profile.
2. If the user asks ANY question outside Friendoo (such as "what is python", general programming, coding questions, general trivia, recipes, politics, weather, math):
   You MUST politely refuse and state:
   "I am Friendoo's dedicated support assistant. I can only assist with Friendoo platform services such as coin recharges, failed payments, host payouts, call billing, or reporting an issue. How can I help with your Friendoo account today?"
3. Style: Keep answers structured like a WhatsApp Banking Bot—polite, formatted with bold *keywords* and bullet points •. Keep response within 3-5 sentences. Always guide the user to the next logical action or offer an official ticket escalation.`;

const HOST_SYSTEM_PROMPT = `You are Friendoo WhatsApp Support Assistant for VERIFIED HOSTS, styled after Indian banking WhatsApp bots (like HDFC/ICICI WhatsApp banking).

IMPORTANT BUSINESS LOGIC:
Hosts DO NOT pay for calls and DO NOT recharge coins or make deposits. Hosts receive calls, earn coins, and withdraw their earnings as cash (INR).

STRICT DOMAIN BOUNDARY (MANDATORY RULE):
1. You ONLY answer questions strictly regarding Friendoo platform operations for HOSTS:
   - Host Payouts & Cash Withdrawals: Minimum withdrawal threshold is ₹500 (1,000 coins). Payouts via UPI/IMPS are processed within 24–48 business hours. If a payout is delayed past 48 hours, reassure host and offer to connect directly with Payout Admin Desk.
   - Completed Call Earnings: Coin earnings are credited immediately upon call completion at host's set per-minute rate. Explain how to check earnings breakdown in Host Dashboard.
   - Call Audio & Stream Stability: Audio disconnects under 15s are not billed to caller and do not earn coins. Provide microphone permissions, battery optimization, and low-latency network guidance.
   - Caller Safety & Abuse Reporting: Strict zero tolerance for harassment, vulgar language, or recording. Hosts can instantly hang up, flag, and block callers via the call screen or caller profile.
2. If the host asks ANY question outside Friendoo (such as "what is python", coding, math, general trivia, recipes):
   You MUST politely refuse and state:
   "I am Friendoo's dedicated support assistant. I can only assist with Friendoo platform services such as coin recharges, failed payments, host payouts, call billing, or reporting an issue. How can I help with your Friendoo account today?"
3. Style: Professional, supportive, formatted with bold *keywords* and bullet points •. Keep response within 3-5 sentences. Offer live 1-on-1 admin chat if their payout or earnings issue requires account verification.`;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json({ error: 'Support service is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { messages, userMessage, role = 'user', isHost = false, userId, name, phone } = body;

    const actualRole: 'host' | 'user' = (role === 'host' || isHost === true) ? 'host' : 'user';
    const activePrompt = actualRole === 'host' ? HOST_SYSTEM_PROMPT : USER_SYSTEM_PROMPT;

    let chatMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: activePrompt },
    ];

    if (Array.isArray(messages) && messages.length > 0) {
      chatMessages = [
        { role: 'system', content: activePrompt },
        ...messages.slice(-8), // keep last 8 turns for context
      ];
    } else if (userMessage && typeof userMessage === 'string') {
      chatMessages.push({ role: 'user', content: userMessage.trim() });
    } else {
      return NextResponse.json({ error: 'Message payload required' }, { status: 400 });
    }

    const lastMessageText = typeof userMessage === 'string'
      ? userMessage
      : (messages && messages.length > 0 ? messages[messages.length - 1].content : '');

    // Extract UTR, Amount, Payout ID
    const utrMatch = lastMessageText.match(/\b\d{12}\b/);
    const amountMatch = lastMessageText.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i) || lastMessageText.match(/\b(\d{2,5})\s*(?:rs|inr|coins?)\b/i);
    const payoutMatch = lastMessageText.match(/(?:payout|pay|req)[-_#]?([a-zA-Z0-9]{6,16})/i);

    const extractedData = {
      utr: utrMatch ? utrMatch[0] : null,
      amount: amountMatch ? amountMatch[1] : null,
      payoutId: payoutMatch ? payoutMatch[1] : null,
    };

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: chatMessages,
        temperature: 0.3,
        max_tokens: 250,
      }),
    });

    if (!groqRes.ok) {
      const errTxt = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errTxt);
      const fallbackReply = actualRole === 'host'
        ? "*Host Support Notice:*\n\n• For delayed withdrawals, minimum payout is *₹500* (24–48h bank time).\n• Tap 'Live Chat with Admin' to check your payout status instantly."
        : "*Friendoo Care Notice:*\n\n• For failed UPI deposits, bank clearance takes *5–15 mins*.\n• If debited, share your 12-digit UTR or tap 'Live Chat with Admin'.";
      return NextResponse.json({
        reply: fallbackReply,
        extractedData,
        suggestEscalation: true,
      });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ||
      (actualRole === 'host'
        ? "I am here to assist with host withdrawals, earnings, or call stability. How can I help your host account today?"
        : "I am here to help with your Friendoo coin balance, failed payments, or call refunds. What can I check for you?");

    const lowerReply = reply.toLowerCase();
    const suggestEscalation =
      lowerReply.includes('admin review') ||
      lowerReply.includes('raise a review') ||
      lowerReply.includes('forward this to a human admin') ||
      lowerReply.includes('ticket') ||
      Boolean(extractedData.utr) ||
      Boolean(extractedData.payoutId);

    // If UTR or payout ID is detected, trigger Make.com webhook automation in background
    if ((extractedData.utr || extractedData.payoutId) && MAKE_SUPPORT_WEBHOOK_URL) {
      fetch(MAKE_SUPPORT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: actualRole === 'host' ? 'host_payout_inquiry' : 'user_deposit_utr_submitted',
          role: actualRole,
          user_id: userId || 'app_user',
          name: name || (actualRole === 'host' ? 'Friendoo Host' : 'Friendoo User'),
          phone: phone || 'unknown',
          scenario: actualRole === 'host' ? 'payout_delay' : 'deposit_failure',
          metadata: extractedData,
          chat_summary: `User message: "${lastMessageText}". Bot response: "${reply.slice(0, 150)}"`,
          timestamp: new Date().toISOString(),
          app: 'Friendoo 24/7 AI WhatsApp Desk',
        }),
      }).catch(err => console.error('Background Make webhook trigger error:', err));
    }

    return NextResponse.json({
      reply,
      extractedData,
      role: actualRole,
      suggestEscalation,
    });
  } catch (err: unknown) {
    console.error('AI chat endpoint error:', err);
    return NextResponse.json(
      {
        reply: "I am currently undergoing a brief update. If you need immediate assistance with failed recharges or host payouts, please tap 'Live Chat with Admin'.",
      },
      { status: 500 }
    );
  }
}
