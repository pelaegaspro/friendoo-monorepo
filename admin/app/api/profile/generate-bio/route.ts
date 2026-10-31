import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, role = 'user' } = body;

    const userInput = typeof prompt === 'string' && prompt.trim().length > 0
      ? prompt.trim()
      : 'friendly and social';

    const isHost = role === 'host';

    const systemPrompt = isHost
      ? 'You are an expert bio writer for hosts on Friendoo, an Indian social voice calling app. Write a warm, engaging, and professional 1-2 sentence profile bio for a voice host based on their keywords. Highlight friendliness, conversation style, and listening skills. Keep it under 25 words. Do NOT include quotes, hashtags, or emojis.'
      : 'You are an expert bio writer for users on Friendoo, an Indian social voice calling app. Write a genuine, friendly, and fun 1-2 sentence profile bio for a caller based on their keywords. Highlight personality and interests. Keep it under 25 words. Do NOT include quotes, hashtags, or emojis.';

    if (!GROQ_API_KEY) {
      // Smart offline fallback if API key is missing
      const fallback = isHost
        ? `Passionate host who loves meaningful conversations about ${userInput}. Always ready for a warm chat!`
        : `Into ${userInput} and always up for good conversations and positive vibes.`;
      return NextResponse.json({ bio: fallback });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
        temperature: 0.7,
        max_tokens: 80,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq Bio error:', groqRes.status, await groqRes.text());
      const fallback = isHost
        ? `Passionate host who loves meaningful conversations about ${userInput}. Always ready for a warm chat!`
        : `Into ${userInput} and always up for good conversations and positive vibes.`;
      return NextResponse.json({ bio: fallback });
    }

    const data = await groqRes.json();
    let generated = data.choices?.[0]?.message?.content?.trim() || '';
    // Clean any quotation marks or leading/trailing prefixes
    generated = generated.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({ bio: generated });
  } catch (error) {
    console.error('Error generating bio:', error);
    return NextResponse.json(
      { bio: 'Friendly conversationalist looking for genuine chats and good vibes.' },
      { status: 200 }
    );
  }
}

