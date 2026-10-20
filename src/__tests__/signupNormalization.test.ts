/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { isRateLimited } from '@/utils/validation';

const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { normalizeAuthEmail, normalizeAuthName, useAuth } from '@/contexts/authHelpers';

afterEach(() => {
  vi.restoreAllMocks();
  mockSignUp.mockReset();
});

describe('signup input normalization', () => {
  it('normalizes email case and whitespace without HTML-encoding valid characters', () => {
    expect(normalizeAuthEmail(' Reader+books&clubs@example.com ')).toBe('reader+books&clubs@example.com');
  });

  it('normalizes a display name without converting it into HTML entities', () => {
    expect(normalizeAuthName("  A&B <Reader>   Gupta  ")).toBe('A&B <Reader> Gupta');
  });

  it('sends the normalized email and plain-text name to Supabase Auth', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: null });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp(' Reader+books&clubs@example.com ', 'ValidPass1', "A&B <Reader>", 'valid-turnstile-token');
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'reader+books&clubs@example.com',
      password: 'ValidPass1',
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
        captchaToken: 'valid-turnstile-token',
        data: { full_name: 'A&B <Reader>' },
      },
    });
  });

  it('does not block registration when browser storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled by browser privacy settings');
    });

    expect(isRateLimited('signup-storage-disabled', 3, 600_000)).toBe(false);
  });
});
