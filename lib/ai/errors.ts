export type FailKind =
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'AUTH'
  | 'BAD_REQUEST'
  | 'CONTENT_FILTER'
  | 'MODEL_GONE'
  | 'PARSE_ERROR';

export class AiError extends Error {
  constructor(
    public kind: FailKind,
    message: string,
    public provider: string,
    public retryable = true,
    public status?: number
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export function classifyError(err: any, provider: string): AiError {
  if (err instanceof AiError) return err;

  const status = err.status || err.statusCode;
  const message = err.message || String(err);

  if (status === 429 || /rate limit|quota|429/i.test(message)) {
    return new AiError('RATE_LIMIT', message, provider, true, 429);
  }
  if (status === 401 || status === 403 || /api key|unauthorized|forbidden|401|403/i.test(message)) {
    return new AiError('AUTH', message, provider, false, status || 401);
  }
  if (status === 404 || /model not found|deprecated|404/i.test(message)) {
    return new AiError('MODEL_GONE', message, provider, true, 404);
  }
  if (/safety|blocked|harm|policy/i.test(message)) {
    return new AiError('CONTENT_FILTER', message, provider, false, 400);
  }
  if (status === 400 || /invalid argument|bad request/i.test(message)) {
    return new AiError('BAD_REQUEST', message, provider, false, 400);
  }
  if (err.name === 'AbortError' || /timeout|deadline/i.test(message)) {
    return new AiError('TIMEOUT', message, provider, true, 408);
  }
  if (status >= 500 || /internal|server error|500|502|503/i.test(message)) {
    return new AiError('SERVER_ERROR', message, provider, true, status || 500);
  }

  return new AiError('PARSE_ERROR', message, provider, true, status);
}

