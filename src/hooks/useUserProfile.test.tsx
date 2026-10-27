/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteUserProfile, useUpsertUserProfile, useUserProfile } from './useUserProfile';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  toast: vi.fn(),
  getSession: vi.fn(),
  rpc: vi.fn(),
  invoke: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { auth: { getSession: mocks.getSession }, rpc: mocks.rpc, functions: { invoke: mocks.invoke } },
}));

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const profile = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  full_name: 'Reader One',
  username: 'reader1',
  profile_photo_url: 'https://example.com/avatar.png',
  bio: 'Loves books',
  location_lat: null,
  location_lng: null,
  location_sharing: false,
  writing_frequency: null,
  stories_written_count: 0,
  stories_read_count: 3,
  tags_used: ['fiction'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: null,
  last_seen: null,
  ...overrides,
});

describe('useUserProfile', () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false, signOut: mocks.signOut });
    mocks.invoke.mockReset();
    mocks.signOut.mockReset().mockResolvedValue(undefined);
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null });
    mocks.rpc.mockReset();
    mocks.toast.mockClear();
  });

  afterEach(() => vi.clearAllMocks());

  it('waits for auth initialization before fetching', () => {
    mocks.useAuth.mockReturnValue({ user: { id: 'user-1' }, loading: true });
    const { result } = renderHook(() => useUserProfile(), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it('normalizes profile name, photo and tags from the owner RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: profile({ full_name: null, name: 'Reader One', profile_photo_url: null, profile_picture_url: 'https://example.com/p.png', tags_used: null, life_tags: ['poetry'] }), error: null });
    const { result } = renderHook(() => useUserProfile(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      id: 'user-1',
      name: 'Reader One',
      full_name: 'Reader One',
      profile_photo_url: 'https://example.com/p.png',
      profile_picture_url: 'https://example.com/p.png',
      life_tags: ['poetry'],
      tags_used: ['poetry'],
    });
    expect(mocks.rpc).toHaveBeenCalledWith('get_my_profile');
  });

  it('does not expose another user profile returned by the RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: profile({ id: 'someone-else' }), error: null });
    const { result } = renderHook(() => useUserProfile(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('does not call the profile RPC when the session is missing or belongs to another user', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const { result } = renderHook(() => useUserProfile(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Failed to load profile data',
      variant: 'destructive',
    }));
  });


  it('clears the local session after account deletion succeeds, even when global logout is rejected', async () => {
    mocks.invoke.mockResolvedValue({ data: { success: true }, error: null });
    mocks.signOut.mockImplementation(async () => {
      // AuthContext handles Supabase's 403 user_not_found by signing out locally.
      return undefined;
    });

    const { result } = renderHook(() => useDeleteUserProfile(), { wrapper: makeWrapper() });
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mocks.invoke).toHaveBeenCalledWith('delete-account', {
      body: { confirmation: 'DELETE' },
    });
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Account deleted',
    }));
  });


  it('keeps deletion successful and clears user data if post-delete logout throws', async () => {
    mocks.invoke.mockResolvedValue({ data: { success: true }, error: null });
    mocks.signOut.mockRejectedValue(new Error('User from sub claim in JWT does not exist'));

    const { result } = renderHook(() => useDeleteUserProfile(), { wrapper: makeWrapper() });
    await act(async () => {
      await expect(result.current.mutateAsync()).resolves.toEqual({ success: true });
    });

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Account deleted',
      description: 'Your Sahadhyayi account and profile have been permanently deleted.',
    }));
  });

  it('does not sign out when account deletion fails', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('Deletion failed') });
    const { result } = renderHook(() => useDeleteUserProfile(), { wrapper: makeWrapper() });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Deletion failed');
    });

    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('normalizes profile updates and updates the query cache on success', async () => {
    const saved = profile({ full_name: 'New Name', profile_photo_url: 'https://example.com/new.png', tags_used: ['history'] });
    mocks.rpc.mockResolvedValue({ data: saved, error: null });
    const Wrapper = makeWrapper();
    const { result } = renderHook(() => useUpsertUserProfile(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        name: 'New Name',
        profile_picture_url: 'https://example.com/new.png',
        life_tags: ['history'],
        bio: undefined,
      });
    });

    expect(mocks.rpc).toHaveBeenCalledWith('update_my_profile', {
      p_profile: {
        name: 'New Name',
        profile_picture_url: 'https://example.com/new.png',
        life_tags: ['history'],
        full_name: 'New Name',
        profile_photo_url: 'https://example.com/new.png',
        tags_used: ['history'],
      },
    });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
      description: 'Profile updated successfully',
    }));
  });

  it('rejects an update when the server cannot confirm the profile owner', async () => {
    mocks.rpc.mockResolvedValue({ data: profile({ id: 'someone-else' }), error: null });
    const { result } = renderHook(() => useUpsertUserProfile(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync({ bio: 'New bio' })).rejects.toThrow('Profile update could not be confirmed.');
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'Failed to update profile. Please try again.',
      variant: 'destructive',
    }));
  });
});
