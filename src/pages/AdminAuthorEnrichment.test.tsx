// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminAuthorEnrichment from './AdminAuthorEnrichment';
import { supabase } from '@/integrations/supabase/client-universal';

describe('AdminAuthorEnrichment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockResult = { count: 10, error: null };
    const makeBuilder = () => {
      const builder: any = {
        select: vi.fn(() => builder),
        or: vi.fn(() => Promise.resolve(mockResult)),
        in: vi.fn(() => Promise.resolve(mockResult)),
        eq: vi.fn(() => Promise.resolve(mockResult)),
        then: (res: any, rej: any) => Promise.resolve(mockResult).then(res, rej),
      };
      return builder;
    };

    vi.spyOn(supabase, 'from').mockImplementation(() => makeBuilder());
  });

  afterEach(() => {
    cleanup();
  });

  it('renders author enrichment title and stats cards', async () => {
    render(<AdminAuthorEnrichment />);

    expect(screen.getByText(/Bring authors to life/i)).toBeInTheDocument();
    expect(screen.getByText('Authors in database')).toBeInTheDocument();
    expect(screen.getByText('Missing portraits')).toBeInTheDocument();
    expect(screen.getByText('Successfully enriched')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh stats/i })).not.toBeDisabled();
    });
  });

  it('invokes enrichment edge function when import button is clicked', async () => {
    const invokeSpy = vi.fn().mockResolvedValue({
      data: {
        processed: 0,
        enriched: 0,
        notFound: 0,
        failed: 0,
        message: 'No more matching authors in this batch.',
      },
      error: null,
    });
    vi.spyOn(supabase, 'functions', 'get').mockReturnValue({
      invoke: invokeSpy,
    } as any);

    render(<AdminAuthorEnrichment />);

    const retryButton = await screen.findByRole('button', {
      name: /Retry missing portraits/i,
    });
    await waitFor(() => {
      expect(retryButton).not.toBeDisabled();
    });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(invokeSpy).toHaveBeenCalledWith(
        'enrich-authors',
        expect.objectContaining({
          body: { limit: 1, refresh: true },
        })
      );
    });
  });

  it('refreshes stats when refresh button is clicked', async () => {
    const fromSpy = vi.spyOn(supabase, 'from');
    render(<AdminAuthorEnrichment />);

    const refreshButton = await screen.findByRole('button', { name: /Refresh stats/i });
    fireEvent.click(refreshButton);

    expect(fromSpy).toHaveBeenCalledWith('authors');
  });
});
