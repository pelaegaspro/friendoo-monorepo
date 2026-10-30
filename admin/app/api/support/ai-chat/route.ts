import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `You are Friendoo Support Assistant, the dedicated 24/7 in-app support agent for Friendoo—a live social audio calling platform.

STRICT DOMAIN BOUNDARY (MANDATORY RULE):
1. You ONLY answer questions strictly regarding Friendoo platform operations:
   - Coin Recharges & Failed Deposits: Explain that Cashfree UPI payments may take 5-15 mins for bank clearance. Advise users to check their Order ID in Transaction History or request an Admin Review.
   - Host Payouts & Withdrawals: Payouts via UPI/IMPS processed within 24-48 business hours. Minimum payout threshold is ₹500 (1000 coins).
   - Coin Economy: Audio calls cost coins per minute based on host rate (minimum 20 coins balance required to initiate a call). Welcome bonus is 50 coins.
   - Call Drops & Billing: Reassure users that calls ending under 15 seconds qualify for automatic or manual coin refunds.
   - Safety, Reporting & Account Issues: How to report abusive hosts/users via the in-call report button or profile view.
2. If the user asks ANY question outside Friendoo (such as "what is python", general programming, coding questions, general trivia, recipes, politics, weather, math):
   You MUST politely refuse and state:
   "I am Friendoo's dedicated support assistant. I can only assist with Friendoo services such as coin recharges, failed payments, host payouts, call billing, or reporting an issue. How can I help with your Friendoo account today?"
3. Keep answers concise, clear, and under 3-4 sentences. Always be polite, warm, and offer to escalate to a human admin if an issue cannot be resolved.`;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json({ error: 'Support service is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { messages, userMessage } = body;

    let chatMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (Array.isArray(messages) && messages.length > 0) {
      chatMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-8), // keep last 8 turns for context
      ];
    } else if (userMessage && typeof userMessage === 'string') {
      chatMessages.push({ role: 'user', content: userMessage.trim() });
    } else {
      return NextResponse.json({ error: 'Message payload required' }, { status: 400 });
    }

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
      return NextResponse.json({
        reply: "I am having temporary trouble reaching the support server. For urgent payment or withdrawal help, please tap 'Open Support Ticket' below.",
      });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 
      "I am here to help with your Friendoo coin balance, failed payments, or host withdrawals. What can I check for you?";

    return NextResponse.json({
      reply,
      suggestEscalation: reply.toLowerCase().includes('admin review') || reply.toLowerCase().includes('raise a review') || reply.toLowerCase().includes('forward this to a human admin'),
    });
  } catch (err: unknown) {
    console.error('AI chat endpoint error:', err);
    return NextResponse.json(
      {
        reply: "I am currently undergoing a brief update. If you need immediate assistance with failed recharges or host payouts, please submit a support ticket directly.",
      },
      { status: 500 }
    );
  }
}
