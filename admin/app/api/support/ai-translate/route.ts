import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const TRANSLATOR_SYSTEM_PROMPT = `You are an expert real-time translator for Friendoo's Indian Customer Support Desk.
Your task is to translate customer support messages between Indian regional languages (Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi) and English.

Rules:
1. Output ONLY the translated text.
2. NEVER include conversational filler, preamble, explanations, markdown quotes, or notes.
3. Preserve all technical tokens verbatim: UTR numbers, dates, times, currency amounts (e.g. ₹99, 200 coins), host names, and emojis.
4. Translate naturally and politely with accurate grammar.`;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text, targetLang = 'en', sourceLang } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text string is required' }, { status: 400 });
    }

    const langNameMap: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      ta: 'Tamil',
      te: 'Telugu',
      ml: 'Malayalam',
      kn: 'Kannada',
      mr: 'Marathi',
      bn: 'Bengali',
      gu: 'Gujarati',
      pa: 'Punjabi',
    };

    const targetLanguageName = langNameMap[targetLang.toLowerCase()] || targetLang;
    const sourceHint = sourceLang ? `from ${langNameMap[sourceLang.toLowerCase()] || sourceLang} ` : '';

    const userPrompt = `Translate the following text ${sourceHint}into ${targetLanguageName}:\n\n${text.trim()}`;

    // Primary: openai/gpt-oss-20b, Fallback: qwen/qwen3.8-27b
    const models = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
    let translatedText = '';

    for (const model of models) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: TRANSLATOR_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 350,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && !content.toLowerCase().includes("i can't help with that") && !content.toLowerCase().includes("i am unable to help")) {
            translatedText = content;
            break;
          }
        }
      } catch (err) {
        console.warn(`Translation model ${model} attempt failed:`, err);
      }
    }

    if (!translatedText) {
      translatedText = text;
    }

    return NextResponse.json({
      originalText: text,
      translatedText,
      targetLang,
      targetLanguageName,
    });
  } catch (error: any) {
    console.error('ai-translate route exception:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
