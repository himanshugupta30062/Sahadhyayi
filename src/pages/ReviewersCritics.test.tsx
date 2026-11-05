// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewersCritics from './ReviewersCritics';
import { supabase } from '@/integrations/supabase/client';

describe('ReviewersCritics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockCreators = [
      {
        id: 'c1',
        name: 'Arundhati Sharma',
        slug: 'arundhati-sharma',
        bio: 'Senior literary essayist and book reviewer.',
        avatar_url: 'https://example.com/arundhati.jpg',
        creator_roles: ['reviewer', 'critic'],
        genres: ['Fiction', 'Essays'],
        languages: ['English', 'Hindi'],
        website_url: 'https://arundhati.example.com',
        featured: true,
        verified: true,
      },
      {
        id: 'c2',
        name: 'Rohan Reads',
        slug: 'rohan-reads',
        bio: 'BookTuber discussing contemporary Indian writing.',
        avatar_url: 'https://example.com/rohan.jpg',
        creator_roles: ['booktuber'],
        genres: ['Sci-Fi', 'Fantasy'],
        languages: ['English'],
        website_url: null,
        featured: false,
        verified: false,
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'literary_creators') {
        const query: any = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          order: vi.fn(() => query),
          limit: vi.fn().mockResolvedValue({ data: mockCreators, error: null }),
        };
        return query;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders reviewers and critics directory with creator cards', async () => {
    render(
      <MemoryRouter>
        <ReviewersCritics />
      </MemoryRouter>
    );

    expect(screen.getByText(/Literary voices/i)).toBeInTheDocument();
    expect(await screen.findByText('Arundhati Sharma')).toBeInTheDocument();
    expect(screen.getByText('Rohan Reads')).toBeInTheDocument();
  });

  it('filters creators by search keyword', async () => {
    render(
      <MemoryRouter>
        <ReviewersCritics />
      </MemoryRouter>
    );

    expect(await screen.findByText('Arundhati Sharma')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search creators/i);
    fireEvent.change(searchInput, { target: { value: 'Rohan' } });

    expect(screen.getByText('Rohan Reads')).toBeInTheDocument();
    expect(screen.queryByText('Arundhati Sharma')).not.toBeInTheDocument();
  });

  it('filters creators by role button', async () => {
    render(
      <MemoryRouter>
        <ReviewersCritics />
      </MemoryRouter>
    );

    expect(await screen.findByText('Arundhati Sharma')).toBeInTheDocument();

    const booktuberFilter = screen.getByRole('button', { name: /BookTuber/i });
    fireEvent.click(booktuberFilter);

    expect(screen.getByText('Rohan Reads')).toBeInTheDocument();
    expect(screen.queryByText('Arundhati Sharma')).not.toBeInTheDocument();
  });
});
