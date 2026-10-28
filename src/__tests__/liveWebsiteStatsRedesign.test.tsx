/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

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
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

let mockUser: any = null;
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mockUser,
    session: mockUser ? { access_token: 'fake-token' } : null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';

describe('Live Website Stats Redesign - Layout, Space, and Diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUser = null;
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders near-full-screen responsive dialog container with fixed header and sticky controls', async () => {
    const mockPayload = {
      timeframe: '24h',
      period: {
        pageViews: 140,
        uniqueVisitors: 65,
        newRegistrations: 12,
        registeredReaders: 1050,
      },
      lifetime: { totalVisits: 10337, sourceTable: 'public.website_visits' },
      rolling: {
        pageViews24h: 140,
        pageViews7d: 890,
        pageViews30d: 3400,
        uniqueVisitors24h: 65,
        sourceTable: 'public.website_visit_events',
        isInitialRollout: false,
      },
      breakdowns: {
        countries: [{ name: 'India', code: 'IN', percent: 70 }],
        pages: [{ name: '/library', percent: 45 }],
        devices: [{ name: 'Desktop', percent: 60 }],
        referrers: [{ name: 'Direct', percent: 55 }],
      },
      timeseries: [
        { label: '10 AM', count: 18, uniqueVisitors: 12, hourIndex: 10 },
        { label: '11 AM', count: 25, uniqueVisitors: 15, hourIndex: 11, isPeak: true },
      ],
      lastUpdated: new Date().toISOString(),
    };

    // This test renders the public overview, so it consumes the public aggregate endpoint.
    mockFunctionsInvoke.mockResolvedValue({ data: mockPayload, error: null });

    render(<CommunityPulseDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Live Website Stats')).toBeInTheDocument();
    });

    // Check near-full-screen dialog container styling
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('community-pulse-dialog');
    const container = dialog.querySelector('.sm\\:max-w-\\[1600px\\]');
    expect(container).toBeInTheDocument();

    // Check All-Time Platform Visits hero card
    expect(screen.getByText('10,337')).toBeInTheDocument();

    // Check timeframe selector
    const select = screen.getByRole('combobox', { name: 'Select timeframe' });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('24h');
  });

  it('supports dual-series chart metric switching between page views, unique visitors, and combined', async () => {
    const mockPayload = {
      timeframe: '24h',
      period: {
        pageViews: 200,
        uniqueVisitors: 90,
        newRegistrations: 5,
        registeredReaders: 500,
      },
      lifetime: { totalVisits: 10337, sourceTable: 'public.website_visits' },
      breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
      timeseries: [
        { label: '2 PM', count: 40, uniqueVisitors: 20, hourIndex: 14 },
      ],
      lastUpdated: new Date().toISOString(),
    };

    mockRpc.mockImplementation((name: string) => {
      if (name === 'get_dual_table_website_analytics') {
        return Promise.resolve({ data: mockPayload, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<CommunityPulseDialog open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Traffic & Visitor Trend')).toBeInTheDocument();
    });

    const metricSelect = screen.getByRole('combobox', { name: 'Select metric' });
    expect(metricSelect).toBeInTheDocument();

    // Switch to combined dual series
    fireEvent.change(metricSelect, { target: { value: 'dual' } });
    expect(metricSelect).toHaveValue('dual');

    // Switch to unique visitors
    fireEvent.change(metricSelect, { target: { value: 'unique' } });
    expect(metricSelect).toHaveValue('unique');
  });

  it('displays Data Health diagnostics tab only for authenticated administrators', async () => {
    // 1. Non-admin user should not see Data Health tab
    mockUser = null;
    const { rerender } = render(<CommunityPulseDialog open={true} onClose={vi.fn()} isAdmin={false} />);

    expect(screen.queryByRole('button', { name: /data health/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics Pipeline Diagnostics')).not.toBeInTheDocument();

    // 2. Admin user should see Data Health tab
    rerender(<CommunityPulseDialog open={true} onClose={vi.fn()} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /data health/i })).toBeInTheDocument();
    });

    // Click Data Health tab
    fireEvent.click(screen.getByRole('tab', { name: /data health/i }));

    await waitFor(() => {
      expect(screen.getByText('Analytics Pipeline Diagnostics')).toBeInTheDocument();
      expect(screen.getByText('Event Ingestion Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Latest Recorded Event')).toBeInTheDocument();
      expect(screen.getByText('Lifetime Source Table')).toBeInTheDocument();
      expect(screen.getByText('Rolling 30-Day Table')).toBeInTheDocument();
    });
  });
});
