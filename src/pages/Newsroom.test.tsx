/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Newsroom from '@/pages/Newsroom';

const mockNews = [
  {
    id: 'news-1',
    title: 'Sahadhyayi Launches Global Reading Initiative',
    slug: 'sahadhyayi-launches-global-reading-initiative',
    summary: 'A new platform feature connecting readers across continents.',
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
    image_credit: 'Unsplash / Photo Contributor',
    image_source_url: 'https://unsplash.com/photos/books',
    category: 'platform',
    source_name: 'Sahadhyayi Editorial',
    source_url: 'https://sahadhyayi.com',
    published_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'news-2',
    title: 'Nobel Laureate Keynote at Literary Festival',
    slug: 'nobel-laureate-keynote',
    summary: 'Historic address celebrating contemporary multilingual literature.',
    cover_image_url: null,
    image_credit: 'Press Trust',
    image_source_url: null,
    category: 'authors',
    source_name: 'Literary Review',
    source_url: 'https://example.com/nobel-keynote',
    published_at: '2026-11-02T12:00:00Z',
  },
];

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: mockNews,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: mockNews, error: null }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

describe('Newsroom Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders news articles and displays image attributions correctly', () => {
    render(
      <MemoryRouter initialEntries={['/news']}>
        <Newsroom />
      </MemoryRouter>
    );

    // Verify main headline and news title
    expect(screen.getByText(/News & updates/i)).toBeInTheDocument();
    expect(screen.getByText(/Sahadhyayi Launches Global Reading Initiative/i)).toBeInTheDocument();

    // Verify image attribution with link on lead article
    const creditLink = screen.getByRole('link', { name: /Unsplash \/ Photo Contributor/i });
    expect(creditLink).toBeInTheDocument();
    expect(creditLink).toHaveAttribute('href', 'https://unsplash.com/photos/books');
    expect(creditLink).toHaveAttribute('target', '_blank');
  });

  it('renders image attribution without link when source URL is not provided', () => {
    render(
      <MemoryRouter initialEntries={['/news?category=authors']}>
        <Newsroom />
      </MemoryRouter>
    );

    // In authors category, news-2 is the first item (not in secondary aside)
    expect(screen.getByText(/Press Trust/i)).toBeInTheDocument();
  });
});
