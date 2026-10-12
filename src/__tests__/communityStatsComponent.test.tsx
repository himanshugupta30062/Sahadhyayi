/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import CommunityStats from '@/components/CommunityStats';

describe('CommunityStats Component - Resilient Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders gracefully from direct DB RPCs when edge function returns 503 or error', async () => {
    // Edge function fails with 503 error
    mockFunctionsInvoke.mockRejectedValue(new Error('Edge Function returned a non-2xx status code'));

    mockRpc.mockImplementation((rpcName: string) => {
      if (rpcName === 'get_total_users_count') return Promise.resolve({ data: 4 });
      if (rpcName === 'get_website_visit_count') return Promise.resolve({ data: 9348 });
      if (rpcName === 'get_top_visitor_countries') {
        return Promise.resolve({
          data: [
            { country_code: 'IN', visit_count: 4497 },
            { country_code: 'US', visit_count: 1897 },
          ],
        });
      }
      return Promise.resolve({ data: null });
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'books_library') {
        return {
          select: vi.fn().mockResolvedValue({ count: 935, data: null }),
        };
      }
      if (table === 'articles') {
        return {
          select: vi.fn().mockResolvedValue({ data: [{ views_count: 10, likes_count: 5 }] }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [] }),
      };
    });

    render(<CommunityStats />);

    // Should display real metrics without crashing or showing error alert
    await waitFor(() => {
      expect(screen.getByText('Community Pulse')).toBeInTheDocument();
      // Visits card
      expect(screen.getByText('All visits')).toBeInTheDocument();
      // Member card
      expect(screen.getByText('All members')).toBeInTheDocument();
    });

    // Should NOT show error alert
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders cleanly when edge function succeeds', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        totalSignups: 42,
        totalVisits: 1200,
        last24hVisits: 85,
        uniqueVisitors24h: 60,
        newSignups24h: 3,
        hourlyActivity: [
          { hourIndex: 0, label: '12 AM', count: 5 },
          { hourIndex: 1, label: '1 AM', count: 3 },
        ],
        topCountries: [
          { code: 'IN', name: 'India', count: 50 },
        ],
        topCities: [
          { name: 'Bengaluru', count: 30 },
        ],
        topMembers: [
          { userId: 'u1', name: 'Reader One', activityCount: 15 },
        ],
        readingEngagement: {
          bookViews: { count: 120 },
          readingProgressUpdates: { count: 30 },
          groupJoins: { count: 10 },
          discussions: { count: 25 },
        },
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(<CommunityStats />);

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalled();
      expect(screen.getByText('1,200')).toBeInTheDocument();
      expect(screen.getByText('Reader One')).toBeInTheDocument();
    });
  });
});
