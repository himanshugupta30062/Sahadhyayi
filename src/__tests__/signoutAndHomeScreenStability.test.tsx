import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthenticatedUserDropdown from '@/components/AuthenticatedUserDropdown';
import UserDropdownMenu from '@/components/navigation/UserDropdownMenu';
import { fetchCurrentReads } from '@/lib/supabase/userBooks';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ data: null }),
}));

vi.mock('@/hooks/useSessionWarning', () => ({
  useSessionWarning: () => ({ showWarning: false, timeRemaining: 0, extendSession: vi.fn() }),
}));

vi.mock('@/utils/catalog/duplicateResolution', () => ({
  verifyAdminStatus: vi.fn().mockResolvedValue(false),
}));

import { useAuth } from '@/contexts/authHelpers';

describe('Sign-out & Home Screen Stability', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders AuthenticatedUserDropdown safely and returns null if user becomes null', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthenticatedUserDropdown
            user={null as any}
            userDisplayName="Guest"
            onSignOut={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders UserDropdownMenu safely and returns null without throwing when user is null', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPassword: vi.fn(),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UserDropdownMenu />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles fetchCurrentReads safely when unauthenticated without throwing errors', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthSessionMissingError', message: 'Auth session missing!' } as any,
    });

    const result = await fetchCurrentReads();
    expect(result).toEqual([]);
  });
});

