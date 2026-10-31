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

    let fileBlob: Blob | null = null;
    let fileName = 'recording.m4a';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonBody = await req.json();
      const base64Data = jsonBody.audioBase64 || jsonBody.audio || jsonBody.file;
      if (base64Data && typeof base64Data === 'string') {
        const cleanBase64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        fileBlob = new Blob([buffer], { type: jsonBody.mimeType || 'audio/m4a' });
        fileName = jsonBody.fileName || 'recording.m4a';
      }
    } else {
      const formData = await req.formData();
      fileBlob = formData.get('file') as Blob | null;
    }

    if (!fileBlob) {
      return NextResponse.json(
        { error: 'No audio file provided in request' },
        { status: 400 }
      );
    }

    // Forward multipart audio directly to Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append('file', fileBlob, fileName);
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
