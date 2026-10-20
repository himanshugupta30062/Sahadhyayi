/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, renderHook, act, cleanup } from '@testing-library/react';
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

import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';
import { useCommunityPulse } from '@/hooks/useCommunityPulse';
import { usePageVisitTracker } from '@/hooks/usePageVisitTracker';

describe('Dual-Table Website Analytics & Rolling 30-Day Architecture', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockCurrentUser = null;
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // 1. Original Table and Lifetime Records Preserved
  it('preserves all-time historical visits and displays rolling metrics from the canonical RPC', async () => {
    mockCurrentUser = { id: 'admin-uuid', email: 'admin@sahadhyayi.com' };
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (name === 'get_dual_table_website_analytics') {
        return Promise.resolve({
          data: {
            period: { pageViews: 340, uniqueVisitors: 180, newRegistrations: 15, registeredReaders: 1042 },
            lifetime: { totalVisits: 28450, sourceTable: 'public.website_visits', label: 'All-Time Visits' },
            rolling: {
              sourceTable: 'public.website_visit_events',
              collectionStartedAt: '2026-10-19T00:00:00Z',
              isInitialRollout: false,
              pageViews24h: 340,
              pageViews7d: 2150,
              pageViews30d: 9400,
              uniqueVisitors24h: 180,
              uniqueVisitors7d: 1200,
              uniqueVisitors30d: 4900,
            },
            timeseries: [],
            breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
            lastUpdated: new Date().toISOString(),
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <BrowserRouter>
        <CommunityPulseDialog open={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/28,450 visits/i)).toBeInTheDocument();
      expect(screen.getByText(/Lifetime/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/340 views/i)).toBeInTheDocument();
    expect(screen.getByText(/2,150 views/i)).toBeInTheDocument();
    expect(screen.getByText(/9,400 views/i)).toBeInTheDocument();
  });

  // 2. Genuine Page Visit Emits Tracking Event
  it('records a genuine page visit event with session and route parameters', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const TestTrackerComponent = () => {
      usePageVisitTracker();
      return <div>Page Content</div>;
    };

    render(
      <MemoryRouter initialEntries={['/library?genre=fiction']}>
        <TestTrackerComponent />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'website-visits',
        expect.objectContaining({
          body: expect.objectContaining({
            event_type: 'pageview',
            page: '/library?genre=fiction',
            session_id: expect.any(String),
            visitor_id: expect.any(String),
          }),
        })
      );
    });
  });

  // 3. React Strict Mode / Remount Deduplication
  it('prevents duplicate event emission on rapid re-renders or Strict Mode component remounts', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const Tracker = () => {
      usePageVisitTracker();
      return <div>Test</div>;
    };

    // First mount
    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Tracker />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledTimes(1);
    });

    // Remount identical route immediately (simulating React Strict Mode / quick re-render)
    unmount();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Tracker />
      </MemoryRouter>
    );

    // Call count must remain 1 because of in-memory deduplication window
    expect(mockFunctionsInvoke).toHaveBeenCalledTimes(1);
  });

  // 4. Timeframe Boundaries (24h, 7d, 30d)
  it('calculates recent-period metrics using distinct timeframe-specific RPC results', async () => {
    mockCurrentUser = { id: 'admin-uuid', email: 'admin@sahadhyayi.com' };
    mockRpc.mockImplementation((name: string, args?: any) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (name === 'get_dual_table_website_analytics') {
        const tf = args?.p_timeframe || '24h';
        const views = tf === '30d' ? 8200 : tf === '7d' ? 1950 : 280;
        return Promise.resolve({
          data: {
            timeframe: tf,
            period: {
              pageViews: views,
              uniqueVisitors: Math.round(views * 0.55),
              newRegistrations: tf === '30d' ? 45 : tf === '7d' ? 12 : 2,
              registeredReaders: 1200,
            },
            lifetime: { totalVisits: 50000, sourceTable: 'public.website_visits' },
            rolling: {
              pageViews24h: 280,
              pageViews7d: 1950,
              pageViews30d: 8200,
              uniqueVisitors24h: 154,
              uniqueVisitors7d: 1072,
              uniqueVisitors30d: 4510,
            },
            timeseries: [],
            breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
            lastUpdated: new Date().toISOString(),
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.pageViews).toBe(280);

    act(() => result.current.setTimeframe('7d'));
    await waitFor(() => expect(result.current.stats?.pageViews).toBe(1950));

    act(() => result.current.setTimeframe('30d'));
    await waitFor(() => expect(result.current.stats?.pageViews).toBe(8200));
  });

  // 5. Dual-Table Architecture Notice & Rollout Start Date
  it('displays collection start notice and distinguishes lifetime vs rolling metrics', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        lifetime: { totalVisits: 15200, sourceTable: 'public.website_visits', label: 'All-Time Visits' },
        rolling: {
          sourceTable: 'public.website_visit_events',
          collectionStartedAt: '2026-10-19T00:00:00Z',
          isInitialRollout: true,
          pageViews24h: 0,
          pageViews7d: 0,
          pageViews30d: 0,
          uniqueVisitors24h: 0,
          uniqueVisitors7d: 0,
          uniqueVisitors30d: 0,
        },
        pageViews: 0,
        uniqueVisitors: 0,
        totalMembers: 800,
        newReaders: 0,
        hourlyActivity: [],
      },
    });

    render(
      <BrowserRouter>
        <CommunityPulseDialog open={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dual-Table Analytics Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Telemetry active • Rolling 30d/i)).toBeInTheDocument();
    });
  });

  // 6. Security: Public Client Cannot Query Raw Event Records
  it('denies direct public queries to raw event table on client and uses RPC/Edge function only', async () => {
    mockCurrentUser = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'website_visit_events') {
        throw new Error('RLS Violation: public cannot query raw website_visit_events');
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
      };
    });

    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'is_admin') return Promise.resolve({ data: false, error: null });
      if (fn === 'get_website_visit_count') return Promise.resolve({ data: 12000, error: null });
      if (fn === 'get_total_users_count') return Promise.resolve({ data: 450, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Public hook must NEVER have queried raw website_visit_events table directly
    expect(mockFrom).not.toHaveBeenCalledWith('website_visit_events');
  });

  // 7. Resilient Recovery from Tracking Failures
  it('never throws or blocks page rendering when the analytics endpoint is unreachable', async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error('Network offline or edge function timeout'));

    const Tracker = () => {
      usePageVisitTracker();
      return <div data-testid="page-loaded">Safe Page</div>;
    };

    // Tracking failure must be caught silently
    render(
      <MemoryRouter initialEntries={['/authors']}>
        <Tracker />
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-loaded')).toBeInTheDocument();
  });
});
