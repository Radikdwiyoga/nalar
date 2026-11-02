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
  model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
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
    const model = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';

    // Batch embedding
    const results: number[][] = [];
    for (const text of texts) {
      const response = await ai.models.embedContent({
        model,
        contents: text,
      });

      const values = response.embeddings?.[0]?.values;
      if (values) {
        results.push(values);
      } else {
        throw new Error('No embedding returned from Gemini');
      }
    }

    return results;
  } catch (err: any) {
    throw classifyError(err, 'gemini');
  }
}
