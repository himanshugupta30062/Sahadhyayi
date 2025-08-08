// src/lib/errors.ts
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'network';

export interface AppError extends Error {
  name: 'AppError';
  status?: number;
  code?: string;
  severity: ErrorSeverity;
  details?: unknown;
  context?: Record<string, any>;
}

export function toAppError(input: unknown, fallback: Partial<AppError> = {}): AppError {
  const e = (input instanceof Error ? input : new Error(String(input))) as AppError;
  e.name = 'AppError';
  e.severity = fallback.severity ?? 'high';
  if ('status' in (input as any)) e.status = (input as any).status;
  if ('code' in (input as any)) e.code = (input as any).code;
  e.context = { ...(fallback.context || {}), ...(e as any).context };
  e.details = (input as any)?.details ?? fallback.details;
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
