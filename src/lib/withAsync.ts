import { toAppError } from './errors';
import { errorHandler } from '@/utils/errorHandler';

export async function withAsync<T>(fn: () => Promise<T>, ctx?: Record<string, any>) {
  try {
    return await fn();
  } catch (e) {
    const appErr = toAppError(e, { severity: 'high', context: ctx });
    errorHandler.handleError({ message: appErr.message, context: appErr.context, severity: appErr.severity });
    throw appErr;
  }
}
