// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminFeedback from './AdminFeedback';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('AdminFeedback', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to home if user is not admin', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' }, loading: false } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: false, error: null } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/feedback']}>
          <Routes>
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('renders feedback list and handles mark responded action', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'admin-1' }, loading: false } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: true, error: null } as any);

    const mockFeedback = [
      {
        id: 'fb-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Great site!',
        message: 'I love reading books here.',
        rating: 5,
        responded: false,
        created_at: '2026-11-01T00:00:00Z',
      },
    ];

    const updateSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockResolvedValue({ error: null });

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockFeedback, error: null }),
      update: updateSpy,
      eq: eqSpy,
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/feedback']}>
          <Routes>
            <Route path="/admin/feedback" element={<AdminFeedback />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('heading', { name: 'User Feedback' })).toBeInTheDocument();
    expect(await screen.findByText('Great site!')).toBeInTheDocument();
    expect(screen.getByText('I love reading books here.')).toBeInTheDocument();

    const respondBtn = screen.getByRole('button', { name: 'Mark Responded' });
    fireEvent.click(respondBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({ responded: true });
      expect(eqSpy).toHaveBeenCalledWith('id', 'fb-1');
    });
  });
});
