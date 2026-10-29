// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CommunityStats, { CommunityPulseDashboard, type CommunityPulseData } from './CommunityStats';

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) } },
}));

const data = (overrides: Partial<CommunityPulseData> = {}): CommunityPulseData => ({
  visits24h: 1234,
  uniqueVisitors24h: null,
  newMembers24h: 7,
  totalMembers: 100,
  totalVisits: 5000,
  topCity: { name: 'Faridabad', visits: 12 },
  hourlyVisits: [{ hour: '9 AM', visits: 4 }, { hour: '10 AM', visits: 8 }],
  topMembers: [{
    id: 'reader-1',
    displayName: 'Reader One',
    avatarUrl: null,
    activityCount: 8,
    activityBreakdown: '3 posts · 5 comments',
  }],
  countries: [{ name: 'India', visits: 30, code: 'IN' }],
  cities: [{ name: 'Faridabad', visits: 12 }],
  engagement: {
    bookViews: 15,
    readingProgressUpdates: null,
    groupJoins: 2,
    discussions: 0,
  },
  updatedAt: '2026-10-29T10:00:00.000Z',
  ...overrides,
});

describe('CommunityPulseDashboard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders formatted traffic, member, city, and engagement metrics', () => {
    render(<CommunityPulseDashboard data={data()} />);

    expect(screen.getByRole('heading', { name: 'Community Pulse' })).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getAllByText('Faridabad').length).toBeGreaterThan(1);
    expect(screen.getByText('Top community members')).toBeInTheDocument();
    expect(screen.getByText('Reader One')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('Book views')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getAllByText('Not tracked').length).toBeGreaterThan(0);
  });

  it('does not invent values when metrics are unavailable', () => {
    render(<CommunityPulseDashboard data={data({
      visits24h: null,
      uniqueVisitors24h: null,
      newMembers24h: null,
      totalMembers: null,
      totalVisits: null,
      topCity: null,
      hourlyVisits: [],
      topMembers: [],
      countries: [],
      cities: [],
      engagement: {
        bookViews: null,
        readingProgressUpdates: null,
        groupJoins: null,
        discussions: null,
      },
      updatedAt: null,
    })} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('No city data')).toBeInTheDocument();
    expect(screen.getByText('Metrics not returned by the backend are shown as unavailable, never estimated.')).toBeInTheDocument();
  });

  it('shows loading and error states and retries when requested', () => {
    const onRefresh = vi.fn();
    render(
      <CommunityPulseDashboard
        data={data({ updatedAt: null })}
        loading
        error="Edge Function unavailable"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading real community statistics');
    expect(screen.getByRole('alert')).toHaveTextContent('Could not refresh community data: Edge Function unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Refresh community stats' })).toBeDisabled();
  });

  it('disables manual refresh when no refresh callback is supplied', () => {
    render(<CommunityPulseDashboard data={data()} />);

    expect(screen.getByRole('button', { name: 'Refresh community stats' })).toBeDisabled();
  });
});


describe('CommunityStats aggregate loader', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.invoke.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads the aggregate endpoint once, normalizes metrics, and caches the result', async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        totalVisits: 5000,
        last24hVisits: 1234,
        uniqueVisitors24h: 800,
        newSignups24h: 7,
        totalSignups: 100,
        lastUpdated: '2026-10-29T10:00:00.000Z',
        hourlyActivity: [{ label: '9 AM', count: 4 }, { hourIndex: 10, count: null }],
        topCountries: [{ code: 'IN', count: 30 }, { code: 'US', name: '', count: 5 }],
        topCities: [{ name: 'Delhi', count: 22 }],
        topMembers: [{
          userId: 'reader-1',
          name: 'Reader One',
          avatarUrl: 'https://example.com/avatar.jpg',
          activityCount: 8,
          breakdown: { posts: 2, comments: 3 },
        }],
        readingEngagement: {
          bookOpens: { count: 15 },
          readingProgressCompletions: 10,
          groupJoins: 3,
          discussions: 1,
        },
      },
      error: null,
    });
    render(<CommunityStats />);

    await waitFor(() => expect(screen.getByText('Reader One')).toBeInTheDocument());
    expect(mocks.invoke).toHaveBeenCalledWith('community-stats', { body: { timeframe: '24h' } });
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getAllByText('Delhi').length).toBeGreaterThan(1);
    expect(screen.getByText('India')).toBeInTheDocument();

    const cached = JSON.parse(localStorage.getItem('community_pulse_dashboard_cache_v2') || '{}');
    expect(cached).toMatchObject({
      visits24h: 1234,
      uniqueVisitors24h: 800,
      newMembers24h: 7,
      totalMembers: 100,
      totalVisits: 5000,
      topCity: { name: 'Delhi', visits: 22 },
      engagement: {
        bookViews: 15,
        readingProgressUpdates: 10,
        groupJoins: 3,
        discussions: 1,
      },
    });
  });

  it('shows backend errors and keeps missing statistics unavailable', async () => {
    const error = new Error('Backend unavailable');
    mocks.invoke.mockResolvedValue({ data: null, error });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CommunityStats />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not refresh community data: Backend unavailable');
    });
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(console.error).toHaveBeenCalledWith('Community Pulse refresh failed:', error);
  });

  it('rejects aggregate responses missing required visit totals', async () => {
    mocks.invoke.mockResolvedValue({ data: { totalVisits: 100 }, error: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CommunityStats />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The community-stats endpoint is missing required visit totals.',
      );
    });
  });
});
