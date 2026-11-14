import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateUserAvatar, useUserAvatar } from './useUserAvatar';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as null | { id: string },
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: mocks.rpc, from: mocks.from },
}));

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useUserAvatar', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.rpc.mockReset();
    mocks.from.mockReset();
  });

  afterEach(() => cleanup());

  it('loads the current reader avatar through the owner-scoped RPC, not table SELECT', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        id: 'avatar-1',
        user_id: 'reader-1',
        avatar_json: { hairStyle: 'curly' },
        avatar_img_url: 'data:image/svg+xml;base64,PHN2Zy8+',
        created_at: '2026-11-14T00:00:00Z',
        updated_at: '2026-11-14T00:00:00Z',
      },
      error: null,
    });

    const { result } = renderHook(() => useUserAvatar(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.rpc).toHaveBeenCalledWith('get_my_avatar');
    expect(mocks.from).not.toHaveBeenCalled();
    expect(result.current.data?.avatar_json).toEqual({ hairStyle: 'curly' });
    expect(result.current.data?.avatar_img_url).toContain('data:image/svg+xml;base64,');
  });

  it('saves the avatar through the owner-scoped RPC and updates the cached query', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        id: 'avatar-1',
        user_id: 'reader-1',
        avatar_json: { hairStyle: 'long' },
        avatar_img_url: 'data:image/svg+xml;base64,PHN2Zy8+',
        created_at: '2026-11-14T00:00:00Z',
        updated_at: '2026-11-14T00:01:00Z',
      },
      error: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateUserAvatar(), { wrapper });
    await result.current.mutateAsync({
      avatar_json: { hairStyle: 'long' },
      avatar_img_url: 'data:image/svg+xml;base64,PHN2Zy8+',
    });

    expect(mocks.rpc).toHaveBeenCalledWith('save_my_avatar', {
      p_avatar_json: { hairStyle: 'long' },
      p_avatar_img_url: 'data:image/svg+xml;base64,PHN2Zy8+',
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('does not query another user through the private self-avatar RPC', async () => {
    const { result } = renderHook(() => useUserAvatar('another-reader'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
