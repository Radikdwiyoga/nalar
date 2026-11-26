import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 120;

const ALLOWED_VOICES = new Set([
  'Kore',
  'Aoede',
  'Zephyr',
  'Leda',
  'Orus',
  'Puck',
  'Charon',
  'Fenrir',
]);

interface InputDialogLine {
  speaker: 'maya' | 'budi' | 'narrator';
  text: string;
}

interface ParsedAudioChunk {
  pcm: Buffer;
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
}

/**
 * Extracts raw PCM bytes and format metadata from either a RIFF WAV buffer or raw 24kHz 16-bit mono L16 PCM.
 */
function extractPcmFromInlineAudio(base64Data: string, mimeType: string): ParsedAudioChunk {
  const buf = Buffer.from(base64Data, 'base64');

  // Check if it starts with "RIFF"...."WAVE"
  if (buf.length > 44 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') {
    let offset = 12;
    let numChannels = 1;
    let sampleRate = 24000;
    let bitsPerSample = 16;

    while (offset + 8 <= buf.length) {
      const chunkId = buf.toString('ascii', offset, offset + 4);
      const chunkSize = buf.readUInt32LE(offset + 4);
      const dataStart = offset + 8;

      if (chunkId === 'fmt ' && dataStart + 16 <= buf.length) {
        numChannels = buf.readUInt16LE(dataStart + 2);
        sampleRate = buf.readUInt32LE(dataStart + 4);
        bitsPerSample = buf.readUInt16LE(dataStart + 14);
      } else if (chunkId === 'data') {
        const end = chunkSize > 0 && dataStart + chunkSize <= buf.length ? dataStart + chunkSize : buf.length;
        return {
          pcm: buf.subarray(dataStart, end),
          sampleRate,
          numChannels,
          bitsPerSample,
        };
      }

      if (chunkSize <= 0) break;
      offset = dataStart + chunkSize + (chunkSize % 2);
    }

    // Fallback if chunk walk exited abnormally
    return {
      pcm: buf.subarray(44),
      sampleRate,
      numChannels,
      bitsPerSample,
    };
  }

  // Raw L16 PCM (e.g. audio/L16;codec=pcm;rate=24000)
  const rateMatch = mimeType.match(/rate=(\d+)/i);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  return {
    pcm: buf,
    sampleRate,
    numChannels: 1,
    bitsPerSample: 16,
  };
}

function createWavBuffer(
  pcm: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM format chunk size
  header.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

async function synthesizeBatchWithGemini(
  batch: InputDialogLine[],
  hostVoice: string,
  analystVoice: string,
  apiKey: string
): Promise<ParsedAudioChunk> {
  const modelsToTry = [
    { id: 'gemini-3.8-flash-lite-tts', mode: 'speechMetadata' as const },
    { id: 'gemini-3.8-flash-tts', mode: 'speechMetadata' as const },
    { id: 'gemini-2.5-flash-preview-tts', mode: 'dialoguePrompt' as const },
  ];

  let lastErr = 'Gagal menghasilkan audio TTS';

  for (const candidate of modelsToTry) {
    try {
      const contents =
        candidate.mode === 'speechMetadata'
          ? [
              {
                role: 'user',
                parts: batch.map((line) => ({
                  text: line.text,
                  speechMetadata: {
                    speaker: line.speaker === 'budi' ? 'Budi' : 'Maya',
                  },
                })),
              },
            ]
          : [
              {
                role: 'user',
                parts: [
                  {
                    text:
                      'Bacakan percakapan podcast Bahasa Indonesia berikut secara natural dan ekspresif:\n' +
                      batch
                        .map((l) => `${l.speaker === 'budi' ? 'Budi' : 'Maya'}: ${l.text}`)
                        .join('\n'),
                  },
                ],
              },
            ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${candidate.id}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: 'Maya',
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } },
                    },
                    {
                      speaker: 'Budi',
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: analystVoice } },
                    },
                  ],
                },
              },
            },
          }),
          signal: AbortSignal.timeout(50_000),
        }
      );

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        lastErr = json?.error?.message || `HTTP ${res.status} dari ${candidate.id}`;
        continue;
      }

      const inlineData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) {
        lastErr = `Respons audio kosong dari ${candidate.id}`;
        continue;
      }

      return extractPcmFromInlineAudio(inlineData.data, inlineData.mimeType || 'audio/wav');
    } catch (err: any) {
      lastErr = err?.message || String(err);
    }
  }

  throw new Error(lastErr);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Silakan login untuk membuat audio podcast.' } },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: 'CONFIG_ERROR', message: 'GEMINI_API_KEY belum dikonfigurasi di server.' } },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const rawLines: InputDialogLine[] = Array.isArray(body?.lines) ? body.lines : [];
    const hostVoice = ALLOWED_VOICES.has(body?.hostVoice) ? body.hostVoice : 'Kore';
    const analystVoice = ALLOWED_VOICES.has(body?.analystVoice) ? body.analystVoice : 'Orus';

    const cleanedLines = rawLines
      .map((l) => ({
        speaker: (l.speaker === 'budi' ? 'budi' : 'maya') as 'maya' | 'budi',
        text: String(l.text || '')
          .replace(/[*#_`~]/g, '')
          .trim(),
      }))
      .filter((l) => l.text.length > 1)
      .slice(0, 36); // Cap up to 36 dialog turns to fit serverless execution safely

    if (cleanedLines.length === 0) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Tidak ada teks dialog untuk dikonversi ke audio.' } },
        { status: 400 }
      );
    }

    // Group lines into balanced batches (~2200 chars or 12 lines max per batch)
    const batches: InputDialogLine[][] = [];
    let currentBatch: InputDialogLine[] = [];
    let currentChars = 0;

    for (const line of cleanedLines) {
      if (currentBatch.length >= 12 || (currentChars + line.text.length > 2200 && currentBatch.length > 0)) {
        batches.push(currentBatch);
        currentBatch = [];
        currentChars = 0;
      }
      currentBatch.push(line);
      currentChars += line.text.length;
    }
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    const pcmChunks: Buffer[] = [];
    let sampleRate = 24000;
    let numChannels = 1;
    let bitsPerSample = 16;

    for (const batch of batches) {
      const chunk = await synthesizeBatchWithGemini(batch, hostVoice, analystVoice, apiKey);
      sampleRate = chunk.sampleRate;
      numChannels = chunk.numChannels;
      bitsPerSample = chunk.bitsPerSample;
      pcmChunks.push(chunk.pcm);
    }

    const combinedPcm = Buffer.concat(pcmChunks);
    const finalWav = createWavBuffer(combinedPcm, sampleRate, numChannels, bitsPerSample);

    return new Response(new Uint8Array(finalWav), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(finalWav.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Podcast TTS generation error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'TTS_FAILED',
          message: err?.message || 'Gagal menyintesis audio podcast.',
        },
      },
      { status: 502 }
    );
  }
}
