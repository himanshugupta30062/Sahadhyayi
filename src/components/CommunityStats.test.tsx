// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CommunityPulseDashboard, type CommunityPulseData } from './CommunityStats';

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { functions: { invoke: vi.fn() } },
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
    expect(screen.getByText('Faridabad')).toBeInTheDocument();
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
