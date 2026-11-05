// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecommendedResearch from './RecommendedResearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('RecommendedResearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts the user to sign in if not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    render(
      <MemoryRouter>
        <RecommendedResearch />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Sign in to get recommendations/i)).toBeInTheDocument();
  });

  it('prompts the user to save papers first if no bookmarks exist', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-123' } } as any);
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    render(
      <MemoryRouter>
        <RecommendedResearch />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Save a few research papers first/i)).toBeInTheDocument();
  });

  it('fetches and displays recommendations based on user bookmarks', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-123' } } as any);
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            openalex_id: 'https://openalex.org/W1',
            paper: { title: 'Quantum Computing Fundamentals' },
          },
        ],
        error: null,
      }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    const mockInvoke = vi.fn().mockResolvedValue({
      data: {
        results: [
          {
            id: 'https://openalex.org/W2',
            title: 'Advanced Quantum Algorithms',
            publication_year: 2024,
            authorships: [{ author: { display_name: 'Alice Turing' } }],
            best_oa_location: { landing_page_url: 'https://example.com/quantum' },
          },
        ],
      },
      error: null,
    });
    vi.spyOn(supabase, 'functions', 'get').mockReturnValue({ invoke: mockInvoke } as any);

    render(
      <MemoryRouter>
        <RecommendedResearch />
      </MemoryRouter>
    );

    expect(await screen.findByText('Advanced Quantum Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Alice Turing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read paper/i })).toHaveAttribute('href', 'https://example.com/quantum');
  });

  it('displays an error message when the search function fails', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-123' } } as any);
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            openalex_id: 'https://openalex.org/W1',
            paper: { title: 'AI Ethics' },
          },
        ],
        error: null,
      }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    const mockInvoke = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Failed to fetch recommendations'),
    });
    vi.spyOn(supabase, 'functions', 'get').mockReturnValue({ invoke: mockInvoke } as any);

    render(
      <MemoryRouter>
        <RecommendedResearch />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Failed to fetch recommendations/i)).toBeInTheDocument();
  });
});
