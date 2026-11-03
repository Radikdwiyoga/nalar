import { GoogleGenAI } from '@google/genai';
import { classifyError } from '../errors';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateGeminiStream({
  model = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite',
  messages,
  temperature = 0.2,
  signal,
}: {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<{
  stream: ReadableStream<string>;
  getUsage: () => Promise<{ inputTokens: number; outputTokens: number }>;
}> {
  try {
    const ai = getClient();

    // Separate system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    // Format for Gemini
    const contents = conversationMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        temperature,
      },
    });

    let inputTokens = 0;
    let outputTokens = 0;

    const stream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (signal?.aborted) {
              controller.error(new Error('Aborted'));
              return;
            }

            if (chunk.text) {
              controller.enqueue(chunk.text);
            }

            if (chunk.usageMetadata) {
              inputTokens = chunk.usageMetadata.promptTokenCount || 0;
              outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
            }
          }
          controller.close();
        } catch (err: any) {
          controller.error(classifyError(err, 'gemini'));
        }
      },
    });

    return {
      stream,
      getUsage: async () => ({
        inputTokens,
        outputTokens,
      }),
    };
  } catch (err: any) {
    throw classifyError(err, 'gemini');
  }
}

export async function generateGeminiEmbeddings(
  texts: string[]
): Promise<number[][]> {
  try {
    const ai = getClient();
    const model = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
    const dim = parseInt(process.env.GEMINI_EMBED_DIM || '1536', 10);

    const results: number[][] = [];
    const batchSize = 15;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let response: any;
      let lastErr: any;

      // Retry up to 3 times per batch
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await ai.models.embedContent({
            model,
            contents: batch,
            config: {
              outputDimensionality: dim,
            },
          });
          lastErr = null;
          break;
        } catch (err: any) {
          lastErr = err;
          await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
        }
      }

      if (lastErr) {
        throw lastErr;
      }

      if (response?.embeddings) {
        for (const emb of response.embeddings) {
          if (emb.values) {
            results.push(emb.values);
          }
        }
      }

      if (i + batchSize < texts.length) {
        await new Promise((res) => setTimeout(res, 200));
      }
    }

    return results;
  } catch (err: any) {
    throw classifyError(err, 'gemini');
  }
}
