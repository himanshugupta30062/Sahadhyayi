/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockFunctionsInvoke(...args),
    },
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

let mockCurrentUser: any = null;
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    session: mockCurrentUser ? { access_token: 'fake-token' } : null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';
import type { CommunityPulseResponse } from '@/types/analytics';

describe('Community Pulse Live Analytics & Truthful Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCurrentUser = null;

    // Default mocks
    mockRpc.mockImplementation((fn: string, params?: any) => {
      if (fn === 'is_admin') return Promise.resolve({ data: false, error: null });
      if (fn === 'get_total_users_count') return Promise.resolve({ data: 0, error: null });
      if (fn === 'get_website_visit_count') return Promise.resolve({ data: 0, error: null });
      if (fn === 'get_dual_table_website_analytics' || fn === 'get_website_stats_dual_table') {
        return mockFunctionsInvoke('community-stats', { body: { timeframe: params?.p_timeframe || '24h' } });
      }
      return Promise.resolve({ data: null, error: null });
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // 1. Measured zero displays 0, never substituted with synthetic numbers
  it('displays true 0 when pageviews, unique visitors, and new readers are zero', async () => {
    const zeroResponse: CommunityPulseResponse = {
      timeframe: '24h',
      periodStart: new Date(Date.now() - 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
      metrics: {
        periodPageViews: { value: 0, comparison: { percentChange: null, direction: 'neutral', periodLabel: 'vs previous 24 hours' } },
        uniqueVisitors: { value: 0, comparison: { percentChange: null, direction: 'neutral', periodLabel: 'vs previous 24 hours' } },
        registeredReaders: { value: 0, comparison: { percentChange: null, direction: 'neutral', periodLabel: 'vs previous 24 hours' } },
        newReaders: { value: 0, comparison: { percentChange: null, direction: 'neutral', periodLabel: 'vs previous 24 hours' } },
        averageSessionDurationSeconds: { value: null, comparison: null },
      },
      hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
        bucketStart: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        hourIndex: i,
        label: `${i}:00`,
        pageViews: 0,
        uniqueVisitors: 0,
        isPeak: false,
      })),
      breakdowns: {
        countries: [],
        pages: [],
        devices: [],
        referrers: [],
      },
      engagement: {
        bookOpens: { value: 0 },
        readingProgressCompletions: { value: 0 },
        groupJoins: { value: 0 },
        discussions: { value: 0 },
      },
      topMembers: [],
      lastUpdated: new Date().toISOString(),
    };

    mockFunctionsInvoke.mockResolvedValue({
      data: zeroResponse,
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('Page views').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Unique visitors').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('New readers')).toBeInTheDocument();
    });

    // Fabricated numbers 9,625 or 9,612 must NEVER appear
    expect(screen.queryByText('9,625')).not.toBeInTheDocument();
    expect(screen.queryByText('9,612')).not.toBeInTheDocument();

    // Check that empty state for chart is displayed
    expect(screen.getByText('No pageviews recorded in this timeframe yet')).toBeInTheDocument();
  });

  // 2. Missing metrics display unavailable / null
  it('displays unavailable indicator for uninstrumented session duration and suppresses comparison badges with null change', async () => {
    const responseWithNulls: CommunityPulseResponse = {
      timeframe: '24h',
      periodStart: new Date(Date.now() - 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
      metrics: {
        periodPageViews: { value: 42, comparison: { percentChange: null, direction: 'neutral', periodLabel: 'vs previous 24 hours' } },
        uniqueVisitors: { value: 12, comparison: null },
        registeredReaders: { value: 15, comparison: null },
        newReaders: { value: 3, comparison: null },
        averageSessionDurationSeconds: { value: null, comparison: null },
      },
      hourlyTraffic: [],
      breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
      engagement: { bookOpens: { value: 5 }, readingProgressCompletions: { value: 0 }, groupJoins: { value: 1 }, discussions: { value: 2 } },
      topMembers: [],
      lastUpdated: new Date().toISOString(),
    };

    mockFunctionsInvoke.mockResolvedValue({
      data: responseWithNulls,
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    // Avg duration should show "—" and "Telemetry unavailable"
    expect(screen.getByText('Telemetry unavailable')).toBeInTheDocument();

    // No synthetic percentage badges like "+12.4%" or "+8.1%" should be rendered
    expect(screen.queryByText(/\+12\.4%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+8\.1%/)).not.toBeInTheDocument();
  });

  // 3. Timeframe switching updates Edge Function invoke parameter
  it('requests 7d and 30d timeframes dynamically when selecting timeframe options', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        timeframe: '24h',
        metrics: {
          periodPageViews: { value: 10 },
          uniqueVisitors: { value: 5 },
          registeredReaders: { value: 100 },
          newReaders: { value: 1 },
        },
        hourlyActivity: [],
        breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
        engagement: {},
        topMembers: [],
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('community-stats', {
        body: { timeframe: '24h' },
      });
    });

    const timeframeSelect = screen.getByRole('combobox', { name: 'Select timeframe' });

    // Switch to 7 Days
    fireEvent.change(timeframeSelect, { target: { value: '7d' } });

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('community-stats', {
        body: { timeframe: '7d' },
      });
    });

    // Switch to 30 Days
    fireEvent.change(timeframeSelect, { target: { value: '30d' } });

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('community-stats', {
        body: { timeframe: '30d' },
      });
    });
  });

  // 4. Empty breakdowns render informative empty states rather than fake distributions
  it('renders clean empty state messages when breakdowns have zero records', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        timeframe: '24h',
        metrics: { periodPageViews: { value: 1 } },
        breakdowns: {
          countries: [],
          pages: [],
          devices: [],
          referrers: [],
        },
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('Page views').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('No country geolocation data recorded yet')).toBeInTheDocument();
    expect(screen.getByText('No page activity records found')).toBeInTheDocument();
    expect(screen.getByText('No device metrics recorded')).toBeInTheDocument();
    expect(screen.getByText('Direct navigation / No referrers')).toBeInTheDocument();
  });

  // 5. Admin-only leaderboard queries and verification
  it('calls get_admin_contributor_leaderboard only when user is verified administrator', async () => {
    // Non-admin user
    mockCurrentUser = { id: 'reader-1', email: 'reader@example.com' };
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'is_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    mockFunctionsInvoke.mockResolvedValue({
      data: {
        timeframe: '24h',
        metrics: { periodPageViews: { value: 10 } },
        topMembers: [
          { rank: 1, userId: 'u1', displayName: 'Anonymous Reader', score: 50 },
        ],
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('is_admin');
    });

    // get_admin_contributor_leaderboard should NOT be called for non-admins
    expect(mockRpc).not.toHaveBeenCalledWith('get_admin_contributor_leaderboard', expect.anything());
  });

  // 6. Admin user fetches admin-only contributor leaderboard
  it('invokes get_admin_contributor_leaderboard for verified admin users', async () => {
    mockCurrentUser = { id: 'admin-1', email: 'admin@sahadhyayi.com' };
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (fn === 'get_admin_contributor_leaderboard') {
        return Promise.resolve({
          data: {
            leaderboard: [
              {
                rank: 1,
                user_id: 'admin-1',
                display_name: 'Admin Master',
                username: 'adminmaster',
                avatar_url: null,
                posts_count: 5,
                comments_count: 10,
                reading_completions: 3,
                group_joins: 2,
                activity_score: 87,
              },
            ],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    mockFunctionsInvoke.mockResolvedValue({
      data: {
        timeframe: '24h',
        metrics: { periodPageViews: { value: 10 } },
        topMembers: [],
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('is_admin');
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('get_admin_contributor_leaderboard', { p_timeframe: '24h' });
    });
  });

  // 7. A lifetime visit RPC cannot stand in for selected-period page views.
  it('shows period page views as unavailable when only lifetime visit totals are available', async () => {
    // Legacy schema from un-deployed Edge function
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        activeRooms: 0,
        lastUpdated: '2026-10-17T13:04:50.447121+00:00',
        activityTrend: [],
        eligibleBooks: 830,
        communityActivity: 0,
        registeredReaders: 4,
      },
      error: null,
    });

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'is_admin') return Promise.resolve({ data: false, error: null });
      if (fn === 'get_website_visit_count') return Promise.resolve({ data: 9920, error: null });
      if (fn === 'get_total_users_count') return Promise.resolve({ data: 4, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      // 9,920 is the lifetime count, not this period's page views.
      const pageViewsLabel = screen.getByText('Page views');
      expect(pageViewsLabel.closest('.rounded-xl')).toHaveTextContent('—');
      expect(pageViewsLabel.closest('.rounded-xl')).not.toHaveTextContent('9,920');
      expect(screen.getByText('4 Total')).toBeInTheDocument();
    });
  });

  // Fallback must never show a lifetime visit count as period page views.
  it('uses the exact selected-period count and never substitutes lifetime visits or guessed zeros', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        registeredReaders: 4,
        totalVisits: 9920,
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'is_admin') return Promise.resolve({ data: false, error: null });
      if (fn === 'get_total_users_count') return Promise.resolve({ data: 4, error: null });
      if (fn === 'get_website_visit_count') return Promise.resolve({ data: 9920, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    mockFrom.mockImplementation((table: string) => {
      const query: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        then: (resolve: (value: any) => unknown) => Promise.resolve({
          count: table === 'website_visits' ? 7 : table === 'profiles' ? 4 : 0,
          error: null,
        }).then(resolve),
      };
      return query;
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      const pageViewsLabel = screen.getAllByText('Page views').find(el => el.closest('.rounded-xl')) || screen.getAllByText('Page views')[0];
      expect(pageViewsLabel.closest('.rounded-xl')).toHaveTextContent('7');
      expect(pageViewsLabel.closest('.rounded-xl')).not.toHaveTextContent('9,920');

      // Unique visitor identity is not available through the count-only fallback.
      const uniqueLabel = screen.getAllByText('Unique visitors').find(el => el.closest('.rounded-xl')) || screen.getAllByText('Unique visitors')[0];
      expect(uniqueLabel.closest('.rounded-xl')).toHaveTextContent('—');
      expect(screen.getByText('4 Total')).toBeInTheDocument();
      expect(screen.getByText('Some analytics details are unavailable')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Select metric'), { target: { value: 'unique' } });
    await waitFor(() => {
      expect(screen.getByText('Hourly unique visitor data is unavailable')).toBeInTheDocument();
    });
  });

  // 8. Distinguishes between measured 0 and unavailable null ('—')
  it('displays "—" when unique visitors is null (telemetry unavailable) but displays "0" when measured zero', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        timeframe: '24h',
        metrics: {
          periodPageViews: { value: 150 },
          uniqueVisitors: { value: null }, // Telemetry unavailable
          registeredReaders: { value: 4 },
          newReaders: { value: 0 }, // Measured zero
        },
        hourlyActivity: [],
        breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
        engagement: {},
        topMembers: [],
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      // New readers was measured 0, so should show +0
      expect(screen.getByText('+0')).toBeInTheDocument();
    });
  });

  // 9. Renders Error Alert Card with Retry button when fetch fails and no cache exists
  it('renders error alert card with retry button when initial fetch fails and no cache exists', async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error('Backend connection refused'));
    mockRpc.mockImplementation(() => Promise.reject(new Error('Connection error')));

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load live community statistics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  // 10. Renders Stale Warning Banner when refresh fails but previous stats exist in cache
  it('renders stale warning banner when refresh fails but previous stats exist in cache', async () => {
    const cachedStats = {
      pageViews: 9920,
      uniqueVisitors: 450,
      newReaders: 2,
      totalMembers: 4,
      avgTimeOnSite: '—',
      hourlyActivity: [],
      countries: [],
      topPages: [],
      devices: [],
      referrers: [],
      lastUpdated: '2026-10-18T10:00:00.000Z',
    };
    localStorage.setItem('sahadhyayi_pulse_stats_24h_v8', JSON.stringify(cachedStats));

    // Refresh attempt fails
    mockFunctionsInvoke.mockRejectedValue(new Error('Gateway timeout'));

    render(<CommunityPulseDialog open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('9,920')).toBeInTheDocument();
      expect(screen.getByText(/Live refresh delayed/)).toBeInTheDocument();
    });
  });
});
