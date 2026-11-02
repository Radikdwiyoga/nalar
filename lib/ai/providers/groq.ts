import Groq from 'groq-sdk';
import { classifyError } from '../errors';

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in environment variables');
  }
  return new Groq({ apiKey });
}

export async function generateGroqStream({
  model = process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
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
    const groq = getClient();

    const groqMessages = messages.map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user') as
        | 'assistant'
        | 'system'
        | 'user',
      content: m.content,
    }));

    const responseStream = await groq.chat.completions.create({
      model,
      messages: groqMessages,
      temperature,
      stream: true,
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

            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              controller.enqueue(delta);
            }

            if (chunk.x_groq?.usage) {
              inputTokens = chunk.x_groq.usage.prompt_tokens || 0;
              outputTokens = chunk.x_groq.usage.completion_tokens || 0;
            }
          }
          controller.close();
        } catch (err: any) {
          controller.error(classifyError(err, 'groq'));
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
    throw classifyError(err, 'groq');
  }
}
