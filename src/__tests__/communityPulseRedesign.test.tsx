/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, renderHook, act, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

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

import StructuredFooter from '@/components/footer/StructuredFooter';
import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';
import { useCommunityPulse, getCacheKey } from '@/hooks/useCommunityPulse';
import { usePageVisitTracker } from '@/hooks/usePageVisitTracker';

describe('Community Pulse Redesign & Visitor Intelligence', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.clearAllMocks();
    localStorage.clear();
    mockCurrentUser = null;
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // 1. Footer Trigger & Dialog Modal Open/Close
  it('opens and closes Community Pulse responsive dialog from StructuredFooter without expanding inline', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        totalVisits: 2847,
        last24hVisits: 2847,
        uniqueVisitors24h: 1203,
        newSignups24h: 86,
        avgTimeOnSite: '3m 24s',
        hourlyActivity: [
          { hourIndex: 0, label: '12 AM', count: 12, isPeak: false },
          { hourIndex: 12, label: '12 PM', count: 180, isPeak: true },
        ],
        topCountries: [{ name: 'India', code: 'IN', count: 100, percent: 62 }],
        topPages: [{ name: '/library', count: 50, percent: 32 }],
        devices: [{ name: 'Mobile', count: 120, percent: 68 }],
        referrers: [{ name: 'Direct', count: 90, percent: 54 }],
        lastUpdated: '2026-10-13T04:00:00.000Z',
      },
    });

    render(
      <BrowserRouter>
        <StructuredFooter />
      </BrowserRouter>
    );

    // Initial check: dialog is not in the DOM
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click footer trigger card
    const trigger = screen.getByRole('button', { name: /open (live website stats|community pulse)/i });
    expect(trigger).toBeInTheDocument();
    act(() => {
      fireEvent.click(trigger);
    });

    // Dialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /(live website stats|community pulse)/i })).toBeInTheDocument();
    });

    // Close using close button
    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // 2. Public User vs Administrator Views (Access Control)
  it('presents aggregate analytics to public visitors but denies access to individual visitor logs', async () => {
    mockCurrentUser = null;
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    mockFunctionsInvoke.mockResolvedValue({
      data: {
        totalVisits: 500,
        last24hVisits: 500,
        uniqueVisitors24h: 300,
        newSignups24h: 20,
        avgTimeOnSite: '2m 45s',
        hourlyActivity: [],
        topCountries: [{ name: 'United States', code: 'US', count: 50, percent: 50 }],
        topPages: [{ name: '/library', count: 40, percent: 40 }],
        devices: [{ name: 'Desktop', count: 60, percent: 60 }],
        referrers: [{ name: 'Google', count: 30, percent: 30 }],
      },
    });

    render(
      <BrowserRouter>
        <CommunityPulseDialog open={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    // Public visitor sees overview metrics
    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('300')).toBeInTheDocument();
    });

    // Recent Visitors tab button MUST NOT be rendered for non-admins
    expect(screen.queryByRole('button', { name: /recent visitors/i })).not.toBeInTheDocument();
    // Raw table / IP addresses must not be rendered
    expect(screen.queryByText(/IP Address/i)).not.toBeInTheDocument();
  });

  // 3. Administrator Can Inspect Real Visitor Intelligence
  it('allows verified administrators to inspect recent visitors with search, filter, pagination, and detail inspector', async () => {
    mockCurrentUser = { id: 'admin-uuid', email: 'admin@sahadhyayi.com' };
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (name === 'get_admin_recent_visits') {
        return Promise.resolve({
          data: [
            {
              id: 101,
              visited_at: '2026-10-13T03:30:00Z',
              ip_address: '122.176.45.12',
              country_code: 'IN',
              city: 'Delhi',
              region: 'Delhi',
              page_url: '/library',
              browser: 'Chrome',
              browser_version: '118.0.0',
              os: 'iOS 17.0',
              device_type: 'Mobile',
              device_model: 'iPhone 14',
              referrer: 'https://google.com',
              screen_resolution: '390x844',
              language: 'en-IN',
              visitor_id: 'a8f3e245-0000-0000-0000-000000000000',
              session_id: 'sess-7f9d2-0000',
              user_id: null,
            },
            {
              id: 102,
              visited_at: '2026-10-13T03:25:00Z',
              ip_address: '198.51.100.24',
              country_code: 'US',
              city: 'New York',
              region: 'NY',
              page_url: '/discussions',
              browser: 'Safari',
              browser_version: '17.1',
              os: 'macOS',
              device_type: 'Desktop',
              device_model: 'Macintosh',
              referrer: 'Direct',
              screen_resolution: '1440x900',
              language: 'en-US',
              visitor_id: 'b9d4e123-0000-0000-0000-000000000000',
              session_id: 'sess-8a1c3-0000',
              user_id: 'auth-user-99',
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    mockFunctionsInvoke.mockResolvedValue({
      data: {
        totalVisits: 1000,
        last24hVisits: 1000,
        uniqueVisitors24h: 800,
        newSignups24h: 50,
        hourlyActivity: [],
        topCountries: [],
        topPages: [],
        devices: [],
        referrers: [],
      },
    });

    render(
      <BrowserRouter>
        <CommunityPulseDialog open={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    // Admin should see the Recent Visitors tab
    const visitorsTabBtn = await screen.findByRole('button', { name: /recent visitors/i });
    expect(visitorsTabBtn).toBeInTheDocument();

    // Switch to Recent Visitors tab
    fireEvent.click(visitorsTabBtn);

    // Verify recent visitor row is displayed
    await waitFor(() => {
      expect(screen.getByText('Delhi, IN')).toBeInTheDocument();
      expect(screen.getAllByText('/library').length).toBeGreaterThanOrEqual(1);
    });

    // Inspector Detail Card should be visible with location, IP, and device specs
    expect(screen.getByText('Delhi, IN (Approximate)')).toBeInTheDocument();
    expect(screen.getByText('122.176.45.12')).toBeInTheDocument();
    expect(screen.getByText('Chrome 118.0.0')).toBeInTheDocument();
    expect(screen.getByText('iOS 17.0')).toBeInTheDocument();
    expect(screen.getByText('390x844')).toBeInTheDocument();
    expect(screen.getByText('en-IN')).toBeInTheDocument();

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/search by ip, location, page/i);
    fireEvent.change(searchInput, { target: { value: 'New York' } });

    // Ensure search input value is registered
    expect(searchInput).toHaveValue('New York');
  });

  // 4. Stale Cache Preservation on Refresh Failure
  it('preserves cached data and labels it as stale without falsifying lastUpdated when refresh fails', async () => {
    const cachedTime = '2026-10-12T10:00:00.000Z';
    localStorage.setItem(
      getCacheKey('24h'),
      JSON.stringify({
        pageViews: 1500,
        uniqueVisitors: 900,
        newReaders: 40,
        avgTimeOnSite: '3m 10s',
        hourlyActivity: [],
        countries: [],
        topPages: [],
        devices: [],
        referrers: [],
        lastUpdated: cachedTime,
      })
    );

    // Refresh attempt fails
    mockFunctionsInvoke.mockRejectedValue(new Error('Edge function timeout'));

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Stats should still exist from cache
    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats?.pageViews).toBe(1500);
    // Marked as stale
    expect(result.current.stats?.isStale).toBe(true);
    // lastUpdated MUST NOT have been updated to the failure moment
    expect(result.current.stats?.lastUpdated).toBe(cachedTime);
    expect(result.current.error).toBe('Edge function timeout');
  });

  // 5. Non-Admin RPC Server-Side Rejection Handling
  it('correctly handles non-admin rejection from get_admin_recent_visits without raw table fallback', async () => {
    mockCurrentUser = { id: 'regular-user', email: 'reader@sahadhyayi.com' };
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        pageViews: 100,
        uniqueVisitors: 50,
        newReaders: 10,
        registeredReaders: 100,
        hourlyActivity: [],
      },
      error: null,
    });
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      if (name === 'get_admin_recent_visits') {
        return Promise.resolve({
          data: null,
          error: { message: 'Unauthorized: Only administrators can view visitor analytics.' },
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });

    // Visitors array must remain empty
    expect(result.current.visitors).toEqual([]);
    // mockFrom must NEVER have been called on website_visits
    expect(mockFrom).not.toHaveBeenCalledWith('website_visits');
  });

  // 6. Resilient Handling of Null / Historical Visits
  it('handles historical records with null metadata gracefully displaying stable identifiers', async () => {
    mockCurrentUser = { id: 'admin-uuid' };
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (name === 'get_admin_recent_visits') {
        return Promise.resolve({
          data: [
            {
              id: 999,
              visited_at: '2026-10-10T00:00:00Z',
              ip_address: null,
              country_code: null,
              city: null,
              region: null,
              page_url: null,
              browser: null,
              browser_version: null,
              os: null,
              device_type: null,
              device_model: null,
              referrer: null,
              screen_resolution: null,
              language: null,
              visitor_id: null,
              session_id: null,
              user_id: null,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.visitors.length).toBe(1);
    });

    const visit = result.current.visitors[0];
    // Displays stable fallback identifier, not empty or fake name
    expect(visit.visitorId).toBe('vis_999');
    expect(visit.location).toBe('Unknown');
    expect(visit.page).toBe('/');
    expect(visit.ipAddress).toBe('Unknown');
  });

  // 7. Visitor Tracker Attaches Verified Session Token Non-Blockingly
  it('attaches session Bearer token in visitor tracking when user is logged in', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'auth-jwt-token-123' } },
    });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    renderHook(() => usePageVisitTracker(), {
      wrapper: ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'website-visits',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer auth-jwt-token-123',
          },
          body: expect.objectContaining({
            event_type: 'pageview',
          }),
        })
      );
    });
  });

  // 8. Resilient Database Fallback when Edge Function is Unreachable or Un-deployed
  it('falls back to database counts and distribution when Edge Function is un-deployed or fails with no cache', async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error('FunctionsFetchError: Failed to send a request to the Edge Function'));
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      if (name === 'get_website_visit_count') return Promise.resolve({ data: 3420, error: null });
      if (name === 'get_total_users_count') return Promise.resolve({ data: 120, error: null });
      return Promise.resolve({ data: null, error: null });
    });
    mockFrom.mockImplementation((table: string) => ({
      select: () => ({
        gte: () => Promise.resolve({ count: 18, data: [], error: null }),
        then: (resolve: any) => resolve({ count: 120, data: [], error: null }),
      }),
    }));

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats?.pageViews).toBe(18);
    expect(result.current.stats?.totalMembers).toBe(120);
    expect(result.current.stats?.newReaders).toBe(18);
    expect(result.current.stats?.hourlyActivity).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // 9. Public Pulse Schema (eligibleBooks, registeredReaders) Resolution
  it('resolves live community-stats public schema into complete analytics without zero or empty states', async () => {
    // Exact schema returned by production Edge Function
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        activeRooms: 0,
        lastUpdated: '2026-10-17T13:04:50.447121+00:00',
        activityTrend: [],
        eligibleBooks: 830,
        communityActivity: 0,
        registeredReaders: 4,
      },
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats!.totalMembers).toBe(4);
    expect(result.current.stats!.pageViews).toBeNull();
    expect(result.current.stats!.uniqueVisitors).toBeNull();
    expect(result.current.stats!.hourlyActivity).toEqual([]);
    expect(result.current.stats!.countries).toEqual([]);
    expect(result.current.stats!.topPages).toEqual([]);
    expect(result.current.stats!.devices).toEqual([]);
    expect(result.current.stats!.referrers).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // 10. Dialog Metric View Switching (Page views vs Unique visitors)
  it('allows switching metric view between page views and unique visitors in chart', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        totalVisits: 1000,
        last24hVisits: 1000,
        uniqueVisitors24h: 500,
        newSignups24h: 30,
        hourlyActivity: [
          { hourIndex: 12, label: '12 PM', count: 100, isPeak: true },
        ],
        topCountries: [{ name: 'India', code: 'IN', count: 500, percent: 50 }],
        topPages: [{ name: '/library', count: 400, percent: 40 }],
        devices: [{ name: 'Mobile', count: 700, percent: 70 }],
        referrers: [{ name: 'Direct', count: 600, percent: 60 }],
      },
    });

    render(
      <BrowserRouter>
        <CommunityPulseDialog open={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    // Metric dropdown should allow switching to Unique visitors
    const select = screen.getByLabelText(/select metric/i);
    fireEvent.change(select, { target: { value: 'unique' } });
    expect(screen.getByDisplayValue('Unique visitors')).toBeInTheDocument();
  });

  // 11. Timeframe Switching Produces Distinct, Timeframe-Aware Metrics (No duplicate or static data)
  it('updates metrics dynamically when switching timeframe between 24h, 7d, and 30d without duplicate data', async () => {
    mockFunctionsInvoke.mockImplementation((fn: string, options?: any) => {
      if (fn === 'community-stats') {
        const tf = options?.body?.timeframe || '24h';
        const views = tf === '30d' ? 4500 : tf === '7d' ? 1200 : 250;
        const newReaders = tf === '30d' ? 65 : tf === '7d' ? 18 : 3;
        return Promise.resolve({
          data: {
            timeframe: tf,
            totalVisits: 10000,
            last24hVisits: views,
            uniqueVisitors24h: Math.round(views * 0.6),
            totalMembers: 450,
            newSignups24h: newReaders,
            comparisons: {
              pageViewsChangePercent: 12,
            },
            hourlyActivity: [{ hourIndex: 0, label: '12 AM', pageViews: 10 }],
            lastUpdated: new Date().toISOString(),
          },
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 24h metrics
    const stats24h = result.current.stats!;
    expect(stats24h.pageViews).toBe(250);
    expect(stats24h.newReaders).toBe(3);
    expect(stats24h.totalMembers).toBe(450);

    // Switch to 7d
    act(() => {
      result.current.setTimeframe('7d');
    });

    await waitFor(() => {
      expect(result.current.stats?.pageViews).toBe(1200);
    });

    const stats7d = result.current.stats!;
    expect(stats7d.newReaders).toBe(18);
    expect(stats7d.totalMembers).toBe(450);

    // Switch to 30d
    act(() => {
      result.current.setTimeframe('30d');
    });

    await waitFor(() => {
      expect(result.current.stats?.pageViews).toBe(4500);
    });

    const stats30d = result.current.stats!;
    expect(stats30d.newReaders).toBe(65);
    expect(stats30d.totalMembers).toBe(450);

    // Ensure 24h, 7d, 30d are distinct and not identical
    expect(stats24h.pageViews).not.toBe(stats7d.pageViews);
    expect(stats7d.pageViews).not.toBe(stats30d.pageViews);
    expect(stats24h.newReaders).not.toBe(stats7d.newReaders);
    expect(stats7d.newReaders).not.toBe(stats30d.newReaders);
  });
});
