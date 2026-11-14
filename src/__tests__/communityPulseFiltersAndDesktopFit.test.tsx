import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CommunityPulseDialog from '@/components/community-pulse/CommunityPulseDialog';
import { useCommunityPulse } from '@/hooks/useCommunityPulse';
import { renderHook, act } from '@testing-library/react';

const mockRpc = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'valid-test-token' } },
        error: null,
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@sahadhyayi.com' },
  }),
}));

describe('CommunityPulse Filters and Desktop Fit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('filters visitors correctly by search query, country name/code, and device', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (name === 'get_admin_recent_visits') {
        return Promise.resolve({
          data: [
            {
              id: '1',
              visited_at: new Date().toISOString(),
              visitor_id: 'vis_in_mob_1',
              city: 'Mumbai',
              country_code: 'IN',
              page_url: '/book/godan',
              referrer: 'Google',
              device_type: 'mobile',
              browser: 'Chrome Mobile',
              os: 'Android',
              ip_address: '103.21.244.1',
            },
            {
              id: '2',
              visited_at: new Date().toISOString(),
              visitor_id: 'vis_us_desk_2',
              city: 'New York',
              country_code: 'US',
              page_url: '/library',
              referrer: 'Direct',
              device_type: 'desktop',
              browser: 'Chrome',
              os: 'macOS',
              ip_address: '172.56.21.9',
            },
            {
              id: '3',
              visited_at: new Date().toISOString(),
              visitor_id: 'vis_uk_tab_3',
              city: 'London',
              country_code: 'GB',
              page_url: '/authors',
              referrer: 'Twitter',
              device_type: 'tablet',
              browser: 'Safari Mobile',
              os: 'iPadOS',
              ip_address: '82.165.197.1',
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    mockInvoke.mockResolvedValue({
      data: {
        pageViews: 120,
        uniqueVisitors: 45,
        totalMembers: 300,
        rolling: {
          pageViews24h: 120,
          pageViews7d: 840,
          pageViews30d: 3600,
          uniqueVisitors24h: 45,
          uniqueVisitors7d: 280,
          uniqueVisitors30d: 1100,
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.visitors.length).toBe(3);
    });

    // 1. Initial unfiltered state
    expect(result.current.filteredVisitors.length).toBe(3);

    // 2. Search query filter
    act(() => {
      result.current.setVisitorSearch('Mumbai');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].location).toContain('Mumbai');

    act(() => {
      result.current.setVisitorSearch('/library');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].page).toBe('/library');

    act(() => {
      result.current.setVisitorSearch('');
    });
    expect(result.current.filteredVisitors.length).toBe(3);

    // 3. Country filter by country name (e.g. 'India' should match 'IN' / 'Mumbai, IN')
    act(() => {
      result.current.setCountryFilter('India');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].countryCode).toBe('IN');

    act(() => {
      result.current.setCountryFilter('United States');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].countryCode).toBe('US');

    act(() => {
      result.current.setCountryFilter('all');
    });
    expect(result.current.filteredVisitors.length).toBe(3);

    // 4. Device filter
    act(() => {
      result.current.setDeviceFilter('mobile');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].deviceType).toBe('mobile');

    act(() => {
      result.current.setDeviceFilter('desktop');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].deviceType).toBe('desktop');

    act(() => {
      result.current.setDeviceFilter('tablet');
    });
    expect(result.current.filteredVisitors.length).toBe(1);
    expect(result.current.filteredVisitors[0].deviceType).toBe('tablet');
  });

  it('resets pagination to page 1 whenever filters or search query changes', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (name === 'get_admin_recent_visits') {
        const fakeRows = Array.from({ length: 25 }, (_, i) => ({
          id: String(i + 1),
          visited_at: new Date().toISOString(),
          visitor_id: `vis_${i + 1}`,
          city: i % 2 === 0 ? 'Delhi' : 'London',
          country_code: i % 2 === 0 ? 'IN' : 'GB',
          page_url: '/',
          referrer: 'Direct',
          device_type: i % 2 === 0 ? 'mobile' : 'desktop',
          browser: 'Chrome',
        }));
        return Promise.resolve({ data: fakeRows, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useCommunityPulse(true));

    await waitFor(() => {
      expect(result.current.visitors.length).toBe(25);
    });

    // Advance to page 2
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);

    // Changing search should reset page to 1
    act(() => {
      result.current.setVisitorSearch('Delhi');
    });
    expect(result.current.page).toBe(1);

    // Set page back to 2
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);

    // Changing country filter should reset page to 1
    act(() => {
      result.current.setCountryFilter('India');
    });
    expect(result.current.page).toBe(1);
  });

  it('updates timeframe immediately with rolling metrics when timeframe changes', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    mockInvoke.mockResolvedValue({
      data: {
        pageViews: 100,
        uniqueVisitors: 40,
        totalMembers: 250,
        rolling: {
          pageViews24h: 100,
          pageViews7d: 700,
          pageViews30d: 3000,
          uniqueVisitors24h: 40,
          uniqueVisitors7d: 250,
          uniqueVisitors30d: 900,
        },
      },
      error: null,
    });

    render(<CommunityPulseDialog open={true} onClose={vi.fn()} isAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText('Live Website Stats')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: 'Select timeframe' });

    // Switch to 7 days
    fireEvent.change(select, { target: { value: '7d' } });
    expect(select).toHaveValue('7d');

    // Switch to 30 days
    fireEvent.change(select, { target: { value: '30d' } });
    expect(select).toHaveValue('30d');
  });

  it('renders desktop dialog with responsive max-width and clean layout constraints', () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'is_admin') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    render(<CommunityPulseDialog open={true} onClose={vi.fn()} isAdmin={false} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const dialogPanel = dialog.querySelector('.sm\\:max-w-5xl, .lg\\:max-w-6xl, .xl\\:max-w-7xl, [class*="max-w"]');
    expect(dialogPanel).toBeInTheDocument();
  });
});
