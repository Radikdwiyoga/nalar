import { generateGeminiStream, generateGeminiEmbeddings } from './providers/gemini';
import { generateGroqStream } from './providers/groq';
import { isCircuitOpen, recordSuccess, recordFailure } from './circuit-breaker';
import { classifyError, AiError } from './errors';

export interface RouteConfig {
  provider: 'gemini' | 'groq' | 'local';
  model: string;
}

export interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  signal?: AbortSignal;
  routeOverride?: string[];
}

export interface AttemptRecord {
  provider: string;
  model: string;
  outcome: 'ok' | 'failed' | 'skipped_circuit_open';
  error?: string;
}

export interface ChatResult {
  stream: ReadableStream<string>;
  provider: 'gemini' | 'groq' | 'local';
  model: string;
  getUsage: () => Promise<{ inputTokens: number; outputTokens: number }>;
  attempts: AttemptRecord[];
}

const DEFAULT_ROUTES: RouteConfig[] = [
  { provider: 'gemini', model: process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite' },
  { provider: 'gemini', model: 'gemini-3.8-flash' },
  { provider: 'groq', model: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b' },
  { provider: 'groq', model: process.env.GROQ_CHAT_MODEL_ALT || 'openai/gpt-oss-20b' },
  { provider: 'groq', model: process.env.GROQ_CHAT_MODEL_FAST || 'qwen/qwen3.8-27b' },
];

export async function chat(req: ChatRequest): Promise<ChatResult> {
  const deadline = Date.now() + (parseInt(process.env.AI_REQUEST_DEADLINE_MS || '45000', 10));
  const attempts: AttemptRecord[] = [];

  const candidateRoutes = req.routeOverride
    ? DEFAULT_ROUTES.filter((r) => req.routeOverride!.includes(`${r.provider}:${r.model}`))
    : DEFAULT_ROUTES;

  let lastError: Error | null = null;

  for (const route of candidateRoutes) {
    if (Date.now() > deadline) {
      throw new AiError('TIMEOUT', 'Permintaan melampaui batas waktu total', 'router', false, 408);
    }

    if (await isCircuitOpen(route)) {
      attempts.push({
        provider: route.provider,
        model: route.model,
        outcome: 'skipped_circuit_open',
      });
      continue;
    }

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        let result: {
          stream: ReadableStream<string>;
          getUsage: () => Promise<{ inputTokens: number; outputTokens: number }>;
        };

        if (route.provider === 'gemini') {
          result = await generateGeminiStream({
            model: route.model,
            messages: req.messages,
            temperature: req.temperature,
            signal: req.signal,
          });
        } else if (route.provider === 'groq') {
          result = await generateGroqStream({
            model: route.model,
            messages: req.messages,
            temperature: req.temperature,
            signal: req.signal,
          });
        } else {
          continue;
        }

        // Successfully initiated stream
        await recordSuccess(route);
        attempts.push({
          provider: route.provider,
          model: route.model,
          outcome: 'ok',
        });

        return {
          stream: result.stream,
          provider: route.provider,
          model: route.model,
          getUsage: result.getUsage,
          attempts,
        };
      } catch (err: any) {
        const classified = classifyError(err, route.provider);
        lastError = classified;

        await recordFailure(route, classified.kind, classified.message);

        attempts.push({
          provider: route.provider,
          model: route.model,
          outcome: 'failed',
          error: `${classified.kind}: ${classified.message}`,
        });

        // If error is not retryable (e.g. content filter or bad request), do not retry or fallback
        if (!classified.retryable && classified.kind !== 'AUTH') {
          throw classified;
        }

        // If retryable and attempt is 0, back off briefly before 1 retry on the same provider
        if (attempt === 0 && classified.retryable) {
          await new Promise((res) => setTimeout(res, 500));
        } else {
          break; // move to next provider in fallback chain
        }
      }
    }
  }

  throw lastError || new Error('Seluruh provider AI gagal merespons');
}

export async function embed(texts: string[]): Promise<number[][]> {
  try {
    return await generateGeminiEmbeddings(texts);
  } catch (err: any) {
    console.error('Embedding failed via Gemini:', err);
    throw err;
  }
}

