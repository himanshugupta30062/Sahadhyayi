// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminOverview from './AdminOverview';
import { supabase } from '@/integrations/supabase/client-universal';

describe('AdminOverview', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it('renders control center header and all quick action shortcuts', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: [
        { user_id: 'u1', role: 'admin' },
        { user_id: 'u2', role: 'moderator' },
      ],
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminOverview />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Sahadhyayi control center')).toBeInTheDocument();
    expect(screen.getByText('Good to see you.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open user experience/i })).toBeInTheDocument();

    // Verify shortcuts are present
    expect(screen.getByText('Manage book events')).toBeInTheDocument();
    expect(screen.getByText('Review PDF submissions')).toBeInTheDocument();
    expect(screen.getByText('Manage the library')).toBeInTheDocument();
    expect(screen.getByText('Manage platform access')).toBeInTheDocument();
    expect(screen.getByText('Review user feedback')).toBeInTheDocument();
    expect(screen.getByText('Website analytics')).toBeInTheDocument();
    expect(screen.getByText('Enrich author records')).toBeInTheDocument();

    // Verify stats after query resolution
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('handles rpc errors gracefully and displays Unavailable for counts', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: new Error('Permission denied'),
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminOverview />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const unavailableElements = await screen.findAllByText('Unavailable');
    expect(unavailableElements.length).toBeGreaterThan(0);
  });
});

