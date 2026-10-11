/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
    channel: (...args: any[]) => mockChannel(...args),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

import { useCommunityStats } from '@/hooks/useCommunityStats';

describe('useCommunityStats - live data synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    });
    mockRemoveChannel.mockResolvedValue({});
  });

  it('updates accurately to live edge count rather than staying frozen at stale higher cached numbers', async () => {
    // Simulate stale high numbers in localStorage
    localStorage.setItem(
      'community-stats',
      JSON.stringify({
        totalSignups: 500,
        totalVisits: 10000,
        last24hVisits: 120,
        topCountries: [],
        lastUpdated: new Date().toISOString(),
      })
    );

    // Live backend returns the real count: 42 signups, 350 visits
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        totalSignups: 42,
        totalVisits: 350,
        last24hVisits: 15,
        topCountries: [{ code: 'IN', count: 20 }],
      },
      error: null,
    });

    mockRpc.mockImplementation((rpcName: string) => {
      if (rpcName === 'get_total_users_count') return Promise.resolve({ data: 42 });
      if (rpcName === 'get_website_visit_count') return Promise.resolve({ data: 350 });
      return Promise.resolve({ data: null });
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 42 }),
    });

    const { result } = renderHook(() => useCommunityStats(true));

    await waitFor(() => {
      // Must reflect live 42, NOT stale 500!
      expect(result.current.stats.totalSignups).toBe(42);
      expect(result.current.stats.totalVisits).toBe(350);
    });

    // LocalStorage must also be updated with authoritative live numbers
    const updatedCache = JSON.parse(localStorage.getItem('community-stats') || '{}');
    expect(updatedCache.totalSignups).toBe(42);
    expect(updatedCache.totalVisits).toBe(350);
  });

  it('safely uses cached stats as initial value when network is slow or offline', async () => {
    localStorage.setItem(
      'community-stats',
      JSON.stringify({
        totalSignups: 25,
        totalVisits: 200,
        last24hVisits: 10,
        topCountries: [],
        lastUpdated: new Date().toISOString(),
      })
    );

    // Network error
    mockFunctionsInvoke.mockRejectedValue(new Error('Network error'));
    mockRpc.mockRejectedValue(new Error('Network error'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    const { result } = renderHook(() => useCommunityStats(true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should fall back gracefully to cached values
    expect(result.current.stats.totalSignups).toBe(25);
    expect(result.current.stats.totalVisits).toBe(200);
  });
});

