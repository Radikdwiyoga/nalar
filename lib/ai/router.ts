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
  preferredProvider?: 'gemini' | 'groq' | 'local' | null;
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

/**
 * Automatically upgrades deprecated or unprefixed model IDs (e.g. from older Vercel env vars)
 * to currently supported 2026 production model IDs.
 */
export function normalizeModelId(provider: RouteConfig['provider'], rawModel: string): string {
  const m = rawModel.trim().replace(/^models\//, '');

  if (provider === 'gemini') {
    if (
      m === 'gemini-2.5-flash' ||
      m === 'gemini-2.0-flash' ||
      m === 'gemini-1.5-flash' ||
      m === 'gemini-1.5-pro'
    ) {
      return 'gemini-3.8-flash';
    }
    if (m === 'gemini-2.5-flash-lite') {
      return 'gemini-3.5-flash-lite';
    }
    return m;
  }

  if (provider === 'groq') {
    if (m === 'gpt-oss-120b') return 'openai/gpt-oss-120b';
    if (m === 'gpt-oss-20b') return 'openai/gpt-oss-20b';
    if (m === 'qwen3.8-27b') return 'qwen/qwen3.8-27b';
    if (
      m === 'llama-3.3-70b-versatile' ||
      m === 'llama-3.1-70b-versatile' ||
      m === 'llama3-70b-8192'
    ) {
      return 'openai/gpt-oss-120b';
    }
    if (m === 'llama-3.1-8b-instant' || m === 'llama3-8b-8192' || m === 'mixtral-8x7b-32768') {
      return 'qwen/qwen3.8-27b';
    }
    return m;
  }

  return m;
}

const VERIFIED_FALLBACK_ROUTES: RouteConfig[] = [
  { provider: 'gemini', model: 'gemini-3.8-flash' },
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'gemini', model: 'gemini-3.5-flash' },
  { provider: 'groq', model: 'qwen/qwen3.8-27b' },
  { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
  { provider: 'groq', model: 'openai/gpt-oss-20b' },
];

function deduplicateRoutes(routes: RouteConfig[]): RouteConfig[] {
  const seen = new Set<string>();
  const result: RouteConfig[] = [];
  for (const r of routes) {
    const normalizedModel = normalizeModelId(r.provider, r.model);
    const key = `${r.provider}:${normalizedModel}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ provider: r.provider, model: normalizedModel });
    }
  }
  return result;
}

function buildDefaultRoutes(): RouteConfig[] {
  const customRoutes: RouteConfig[] = [];

  const envRouteStr = process.env.AI_CHAT_ROUTE?.trim();
  if (envRouteStr) {
    for (const rawEntry of envRouteStr.split(',')) {
      const entry = rawEntry.trim();
      const idx = entry.indexOf(':');
      if (idx === -1) continue;
      const provider = entry.slice(0, idx).trim() as RouteConfig['provider'];
      const model = entry.slice(idx + 1).trim();
      if ((provider === 'gemini' || provider === 'groq' || provider === 'local') && model) {
        customRoutes.push({ provider, model: normalizeModelId(provider, model) });
      }
    }
  } else {
    if (process.env.GEMINI_CHAT_MODEL) {
      customRoutes.push({
        provider: 'gemini',
        model: normalizeModelId('gemini', process.env.GEMINI_CHAT_MODEL),
      });
    }
    if (process.env.GROQ_CHAT_MODEL) {
      customRoutes.push({
        provider: 'groq',
        model: normalizeModelId('groq', process.env.GROQ_CHAT_MODEL),
      });
    }
  }

  // Always append verified live fallback routes so stale env vars can never brick chat/studio
  return deduplicateRoutes([...customRoutes, ...VERIFIED_FALLBACK_ROUTES]);
}

export function getConfiguredRoutes(
  preferredProvider?: 'gemini' | 'groq' | 'local' | null
): RouteConfig[] {
  const base = buildDefaultRoutes();
  if (!preferredProvider || preferredProvider === 'local') {
    return base;
  }
  const primary = base.filter((r) => r.provider === preferredProvider);
  const secondary = base.filter((r) => r.provider !== preferredProvider);
  return [...primary, ...secondary];
}

export async function chat(req: ChatRequest): Promise<ChatResult> {
  const deadline = Date.now() + parseInt(process.env.AI_REQUEST_DEADLINE_MS || '45000', 10);
  const maxRetry = parseInt(process.env.AI_MAX_RETRY_PER_PROVIDER || '1', 10);
  const attempts: AttemptRecord[] = [];

  const orderedRoutes = getConfiguredRoutes(req.preferredProvider);
  const candidateRoutes = req.routeOverride
    ? orderedRoutes.filter((r) => req.routeOverride!.includes(`${r.provider}:${r.model}`))
    : orderedRoutes;

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

    for (let attempt = 0; attempt <= maxRetry; attempt++) {
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

        if (classified.kind === 'CONTENT_FILTER') {
          throw classified;
        }

        if (classified.kind === 'MODEL_GONE' || classified.kind === 'AUTH') {
          break;
        }

        if (attempt === 0 && classified.retryable) {
          await new Promise((res) => setTimeout(res, 500));
        } else {
          break;
        }
      }
    }
  }

  const attemptSummary = attempts
    .map((a) => `${a.provider}:${a.model} [${a.outcome}${a.error ? ': ' + a.error : ''}]`)
    .join(' | ');

  throw new Error(attemptSummary || lastError?.message || 'Seluruh provider AI gagal merespons');
}

export async function embed(texts: string[]): Promise<number[][]> {
  try {
    return await generateGeminiEmbeddings(texts);
  } catch (err: any) {
    console.error('Embedding failed via Gemini:', err);
    throw err;
  }
}
