import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const AI_WINGMAN_SYSTEM_PROMPT = `You are Friendoo AI Conversation Wingman—an expert social coach for 1-on-1 voice calls on Friendoo, an Indian social friendship app.
Your job is to provide 3 natural, charming, engaging conversation starters / leads that help shy callers or hosts break awkward silences and keep conversations flowing effortlessly.

Guidelines:
1. Provide exactly 3 short, catchy conversational tips/questions.
2. Tone must be warm, respectful, friendly, and culturally tailored for young Indian conversations (casual Hinglish/English/Tamil context).
3. NO cheesy pickup lines, NO vulgarity, NO cringe. Focus on curiosity, shared experiences (movies, food, music, midnight thoughts, dreams), and genuine warmth.
4. Output strict JSON format with an array of 3 suggestions:
{
  "tips": [
    { "lead": "...", "category": "..." },
    { "lead": "...", "category": "..." },
    { "lead": "...", "category": "..." }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      vibe = 'casual',
      language = 'English',
      isHost = false,
      partnerName = 'friend',
    } = body;

    const userPrompt = `Generate 3 conversation tips for a ${isHost ? 'host' : 'caller'} talking to ${partnerName}.
Current Vibe: ${vibe} (e.g. break_silence, playful, deep, compliment, food_and_music).
Preferred Language/Context: ${language}.
Focus on easy open-ended questions that make ${partnerName} want to share stories.`;

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        tips: getFallbackTips(vibe, language, partnerName),
      });
    }

    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    let tips: Array<{ lead: string; category: string }> = [];

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
              { role: 'system', content: AI_WINGMAN_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 300,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
          if (Array.isArray(parsed.tips) && parsed.tips.length > 0) {
            tips = parsed.tips;
            break;
          }
        }
      } catch (err) {
        console.warn(`AI Wingman model ${model} attempt failed:`, err);
      }
    }

    if (tips.length === 0) {
      tips = getFallbackTips(vibe, language, partnerName);
    }

    return NextResponse.json({ tips });
  } catch (error: any) {
    console.error('AI Wingman error:', error);
    return NextResponse.json({
      tips: getFallbackTips('casual', 'English', 'friend'),
    });
  }
}

function getFallbackTips(vibe: string, lang: string, name: string): Array<{ lead: string; category: string }> {
  switch (vibe) {
    case 'break_silence':
      return [
        { lead: `So ${name}, tell me one crazy or funny thing that happened to you this week!`, category: 'Silence Breaker 🧊' },
        { lead: 'Quick question: Are you an energetic morning person or a quiet late-night thinker?', category: 'Personality ☕' },
        { lead: 'What is your go-to comfort song right now that you listen to on repeat?', category: 'Music 🎵' },
      ];
    case 'deep':
      return [
        { lead: 'If you could pause time and go anywhere right now, where would you be?', category: 'Dreams ✈️' },
        { lead: 'What is something that made you genuinely happy recently that you did not expect?', category: 'Gratitude ✨' },
        { lead: 'What is one dream project or hobby you have always wanted to dive into?', category: 'Passion 🚀' },
      ];
    case 'playful':
      return [
        { lead: 'Be honest: What is your ultimate guilty pleasure midnight snack craving?', category: 'Foodie 🍕' },
        { lead: 'If we were in a zombie apocalypse right now, what would your survival role be?', category: 'Funny 😂' },
        { lead: 'Which movie or series can you re-watch 100 times without ever getting bored?', category: 'Cinema 🎬' },
      ];
    case 'compliment':
      return [
        { lead: 'You know, you have such a calming voice to listen to after a long day.', category: 'Sweet Voice 🎙️' },
        { lead: 'I really love how easy it is to talk to you—great energy!', category: 'Positive Vibe ✨' },
        { lead: 'You seem like someone who gives amazing life advice to their friends.', category: 'Great Listener 👂' },
      ];
    default:
      return [
        { lead: `So ${name}, how was your day today? Did anything interesting happen?`, category: 'Casual 💬' },
        { lead: 'Tea or Coffee person? And what is your favorite place to have it?', category: 'Icebreaker ☕' },
        { lead: 'What kind of music lifts your mood when you want to relax?', category: 'Music 🎶' },
      ];
  }
}
