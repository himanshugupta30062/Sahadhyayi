/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Discovery from './Discovery';

const mockBooks = [
  {
    id: 'book-1',
    title: 'The Cozy Tea Guild',
    author: 'Emily Thorne',
    genre: 'Fiction',
    description: 'A cozy heartwarming tale of village bakers and tea.',
    pages: 190,
    cover_image_url: 'https://example.com/cover1.jpg',
    pdf_url: 'https://example.com/read.pdf',
    language: 'English',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'book-2',
    title: 'Shadows of the Citadel',
    author: 'Derrick Vance',
    genre: 'Fantasy',
    description: 'A dark and gritty quest through forbidden ruins.',
    pages: 520,
    cover_image_url: null,
    pdf_url: null,
    language: 'English',
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'book-3',
    title: 'The Silent Thinker',
    author: 'Marcus Cole',
    genre: 'Philosophy',
    description: 'Deep philosophical reflections on modern human existence.',
    pages: 280,
    cover_image_url: null,
    pdf_url: null,
    language: 'English',
    created_at: '2026-03-01T00:00:00Z',
  },
];

vi.mock('@/hooks/useLibraryBooks', () => ({
  useAllLibraryBooks: () => ({
    data: mockBooks,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/useBookRecommendations', () => ({
  useBookRecommendations: () => ({ data: [] }),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({ data: [] }),
  useAddToBookshelf: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/discovery/SemanticBookDiscovery', () => ({
  default: () => <div data-testid="semantic-discovery-mock">Semantic Discovery</div>,
}));

vi.mock('@/hooks/useBookExperienceSummary', () => ({
  useBookExperienceSummary: () => ({
    data: new Map([
      [
        'book-2',
        {
          book_id: 'book-2',
          moods: ['dark'],
          pacing: 'slow',
          content_warnings: ['violence'],
          community_tags_count: 3,
        },
      ],
    ]),
  }),
}));

describe('Discovery Page with Mood & Pace Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders discovery page and all initial books', () => {
    render(
      <MemoryRouter initialEntries={['/discovery']}>
        <Discovery />
      </MemoryRouter>
    );

    expect(screen.getByText(/Discover Your Next Read/i)).toBeInTheDocument();
    expect(screen.getByText('The Cozy Tea Guild')).toBeInTheDocument();
    expect(screen.getByText('Shadows of the Citadel')).toBeInTheDocument();
    expect(screen.getByText('The Silent Thinker')).toBeInTheDocument();
  });

  it('filters books by mood and shows explainable badges', () => {
    render(
      <MemoryRouter initialEntries={['/discovery']}>
        <Discovery />
      </MemoryRouter>
    );

    // Select "Comforting & Cozy" mood
    const comfortingChip = screen.getByRole('button', { name: /Comforting & Cozy/i });
    fireEvent.click(comfortingChip);

    // Only The Cozy Tea Guild matches
    expect(screen.getByText('The Cozy Tea Guild')).toBeInTheDocument();
    expect(screen.queryByText('Shadows of the Citadel')).not.toBeInTheDocument();
    expect(screen.queryByText('The Silent Thinker')).not.toBeInTheDocument();

    // Verify active filter badge is displayed
    expect(screen.getByText(/☕ Comforting & Cozy/i)).toBeInTheDocument();
  });

  it('filters books by reading pace (Quick read: <= 220 pages)', () => {
    render(
      <MemoryRouter initialEntries={['/discovery']}>
        <Discovery />
      </MemoryRouter>
    );

    const quickReadBtn = screen.getByRole('button', { name: /Quick read/i });
    fireEvent.click(quickReadBtn);

    // book-1 is 190 pages -> matches
    expect(screen.getByText('The Cozy Tea Guild')).toBeInTheDocument();
    // book-2 is 520 pages, book-3 is 280 pages -> do not match
    expect(screen.queryByText('Shadows of the Citadel')).not.toBeInTheDocument();
    expect(screen.queryByText('The Silent Thinker')).not.toBeInTheDocument();
  });

  it('excludes books when safety content warnings are applied', () => {
    render(
      <MemoryRouter initialEntries={['/discovery']}>
        <Discovery />
      </MemoryRouter>
    );

    // Open warnings configuration
    const configBtn = screen.getByRole('button', { name: /Configure excluded topics/i });
    fireEvent.click(configBtn);

    // Hide violence (exact regex to distinguish from "sexual violence")
    const violenceBtn = screen.getByRole('button', { name: /^violence$/i });
    fireEvent.click(violenceBtn);

    // book-2 has community warning 'violence' -> should now be hidden
    expect(screen.queryByText('Shadows of the Citadel')).not.toBeInTheDocument();
    expect(screen.getByText('The Cozy Tea Guild')).toBeInTheDocument();
    expect(screen.getByText('The Silent Thinker')).toBeInTheDocument();
  });

  it('clears all active filters when Clear all is pressed', () => {
    render(
      <MemoryRouter initialEntries={['/discovery?mood=dark']}>
        <Discovery />
      </MemoryRouter>
    );

    // In dark mood, only book-2 is shown
    expect(screen.getByText('Shadows of the Citadel')).toBeInTheDocument();
    expect(screen.queryByText('The Cozy Tea Guild')).not.toBeInTheDocument();

    // Click "Clear all"
    const clearBtn = screen.getByRole('button', { name: /Clear all/i });
    fireEvent.click(clearBtn);

    // All books should be restored
    expect(screen.getByText('The Cozy Tea Guild')).toBeInTheDocument();
    expect(screen.getByText('Shadows of the Citadel')).toBeInTheDocument();
    expect(screen.getByText('The Silent Thinker')).toBeInTheDocument();
  });
});
