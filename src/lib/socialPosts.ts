export class PostCreationError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(
    message: string,
    options?: { code?: string; details?: string; hint?: string; cause?: unknown }
  ) {
    super(message);
    this.name = 'PostCreationError';
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, PostCreationError.prototype);
  }
}

export function requirePersistedSocialPost<T extends { id?: string | null }>(
  post: T | null | undefined
): T {
  if (!post?.id) {
    throw new PostCreationError('The post could not be confirmed as saved. Please try again.', {
      code: 'PGRST116',
    });
  }

  return post;
}

export function normalizePostCreationError(error: unknown): PostCreationError {
  if (error instanceof PostCreationError) {
    return error;
  }

  const raw = (error && typeof error === 'object' ? error : {}) as Record<string, unknown>;
  const code = typeof raw.code === 'string' ? raw.code : undefined;
  const rawMessage = typeof raw.message === 'string' ? raw.message : '';
  const details = typeof raw.details === 'string' ? raw.details : undefined;
  const hint = typeof raw.hint === 'string' ? raw.hint : undefined;

  // Development diagnostics logging
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.error('[SocialPost Diagnostic]', {
      code,
      message: rawMessage,
      details,
      hint,
      error,
    });
  }

  // Safe user-friendly mapping
  let safeMessage = 'Unable to create post. Please try again.';

  if (code === '42501') {
    safeMessage = 'You must be signed in to create a post. Please sign in again.';
  } else if (code === '23503') {
    safeMessage = 'The referenced book or profile could not be found. Please try again.';
  } else if (code === '22P02') {
    safeMessage = 'Invalid book reference format. Please re-select the book.';
  } else if (code === '42703') {
    safeMessage = 'Database schema mismatch. Retrying with basic fields…';
  } else if (rawMessage && !rawMessage.includes('column') && !rawMessage.includes('relation') && !rawMessage.includes('violates foreign key')) {
    safeMessage = rawMessage;
  }

  return new PostCreationError(safeMessage, {
    code,
    details,
    hint,
    cause: error,
  });
}
