// src/lib/errors.ts
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'network';

export interface AppError extends Error {
  name: 'AppError';
  status?: number;
  code?: string;
  severity: ErrorSeverity;
  details?: unknown;
  context?: Record<string, unknown>;
}

export function toAppError(input: unknown, fallback: Partial<AppError> = {}): AppError {
  const e = (input instanceof Error ? input : new Error(String(input))) as AppError;
  const source =
    input !== null && (typeof input === 'object' || typeof input === 'function')
      ? (input as Record<string, unknown>)
      : undefined;

  e.name = 'AppError';
  e.severity = fallback.severity ?? 'high';

  if (source && 'status' in source) e.status = source.status as number | undefined;
  if (source && 'code' in source) e.code = source.code as string | undefined;

  const inputContext = source?.context;
  const safeInputContext =
    inputContext !== null && typeof inputContext === 'object' && !Array.isArray(inputContext)
      ? (inputContext as Record<string, unknown>)
      : {};
  e.context = { ...(fallback.context ?? {}), ...safeInputContext };
  e.details = source?.details ?? fallback.details;

  return e;
}

export async function safeJson(res: Response) {
  const text = await res.text().catch(() => '');
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}
