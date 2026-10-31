import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured on server' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided in request' },
        { status: 400 }
      );
    }

    // Forward multipart audio directly to Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append('file', file, 'recording.m4a');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('temperature', '0');
    groqFormData.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq Whisper error:', groqRes.status, errText);
      return NextResponse.json(
        { error: 'Failed to transcribe audio via Groq Whisper', details: errText },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    return NextResponse.json({
      success: true,
      text: data.text || '',
    });
  } catch (error: any) {
    console.error('Voice transcription server error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing voice note', details: error.message },
      { status: 500 }
    );
  }
}
