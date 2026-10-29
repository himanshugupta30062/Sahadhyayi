/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup, renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });

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

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';
import { getBaselineStats, useCommunityPulse } from '@/hooks/useCommunityPulse';
import { trackAnalyticsEvent } from '@/lib/analytics';

describe('Live Website Metrics End-to-End Pipeline & Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('does not write metadata-free page views when the Edge Function fails', async () => {
    mockFunctionsInvoke.mockRejectedValue(new Error('Edge function 500 error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await trackAnalyticsEvent('pageview', undefined, '/library');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('website-visits', expect.anything());
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('maps the canonical dual-table contract accurately in useCommunityPulse', async () => {
    const canonicalPayload = {
      timeframe: '24h',
      period: {
        pageViews: 120,
        uniqueVisitors: 45,
        newRegistrations: 8,
        registeredReaders: 890,
      },
      lifetime: {
        totalVisits: 10313,
        sourceTable: 'public.website_visits',
      },
      rolling: {
        pageViews24h: 120,
        pageViews7d: 840,
        pageViews30d: 3200,
        uniqueVisitors24h: 45,
        uniqueVisitors7d: 210,
        uniqueVisitors30d: 780,
        sourceTable: 'public.website_visit_events',
        collectionStartedAt: '2026-10-19T00:00:00Z',
        isInitialRollout: false,
      },
      comparison: {
        pageViewsChangePercent: 15.2,
        uniqueVisitorsChangePercent: -4.1,
        newRegistrationsChangePercent: 20.0,
      },
      timeseries: [
        { label: '10 AM', pageViews: 14, hourIndex: 10, isPeak: true },
        { label: '11 AM', pageViews: 22, hourIndex: 11, isPeak: false },
      ],
      breakdowns: {
        countries: [{ name: 'India', value: 80, percentage: 66.7 }],
        pages: [{ path: '/library', views: 70, percentage: 58.3 }],
        devices: [{ name: 'Desktop', percentage: 70 }],
        referrers: [{ source: 'Direct', visitors: 60, percentage: 50 }],
      },
      lastUpdated: new Date().toISOString(),
    };

    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'fake-token' } }, error: null });
    mockFunctionsInvoke.mockResolvedValue({ data: canonicalPayload, error: null });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.stats?.pageViews).toBe(120);
    });

    expect(result.current.stats?.pageViews).toBe(120);
    expect(result.current.stats?.uniqueVisitors).toBe(45);
    expect(result.current.stats?.newReaders).toBe(8);
    expect(result.current.stats?.totalMembers).toBe(890);
    expect(result.current.stats?.lifetimeVisits).toBe(10313);
    expect(result.current.stats?.dualTable?.sourceTable || result.current.stats?.dualTable?.rollingSourceTable).toBe('public.website_visit_events');
    expect(result.current.stats?.pageViewsChange?.value).toBe(15.2);
    expect(result.current.stats?.hourlyActivity).toHaveLength(2);
    expect(result.current.stats?.topPages[0].path).toBe('/library');
  });

  it('renders single authoritative timeframe selector driving metrics without duplicate cards', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        timeframe: '24h',
        period: { pageViews: 50, uniqueVisitors: 20, newRegistrations: 2, registeredReaders: 500 },
        lifetime: { totalVisits: 10313, sourceTable: 'public.website_visits' },
        rolling: { pageViews24h: 50, pageViews7d: 350, pageViews30d: 1200, uniqueVisitors24h: 20, sourceTable: 'public.website_visit_events', isInitialRollout: false },
        breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
        timeseries: [],
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    });

    render(
      <BrowserRouter>
        <CommunityPulseDialog
        open={true}
        onClose={vi.fn()}
        stats={{
          ...getBaselineStats('24h'),
          pageViews: 50,
          uniqueVisitors: 20,
          newReaders: 2,
          totalMembers: 500,
          lifetimeVisits: 10313,
          dualTable: {
            lifetimeVisits: 10313,
            lifetimeSourceTable: 'public.website_visits',
            rolling24hViews: 50,
            rolling7dViews: 350,
            rolling30dViews: 1200,
            uniqueVisitors24h: 20,
            uniqueVisitors7d: null,
            uniqueVisitors30d: null,
            rollingSourceTable: 'public.website_visit_events',
            isInitialRollout: false,
          },
        }}
      />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Live Website Stats')).toBeInTheDocument();
      // Lifetime visits displayed in distinct hero banner
      expect(screen.getByText(/10[,.\s\u202f]?313/)).toBeInTheDocument();
      expect(screen.getByText(/public\.website_visits/)).toBeInTheDocument();
      // Period page views displayed in top KPI card
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('500 Total')).toBeInTheDocument();
    });

    // Timeframe selector is present
    const select = screen.getByRole('combobox', { name: 'Select timeframe' });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('24h');
  });
});
