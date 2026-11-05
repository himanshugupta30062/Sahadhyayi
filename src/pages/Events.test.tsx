// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Events from './Events';
import { supabase } from '@/integrations/supabase/client';

describe('Events', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockCategories = [
      { id: 'cat-1', name: 'Book Fairs', slug: 'book-fair' },
      { id: 'cat-2', name: 'Literature Festivals', slug: 'literature-festival' },
    ];
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Jaipur Literature Festival',
        slug: 'jaipur-literature-festival',
        category_id: 'cat-2',
        start_at: '2027-01-20T10:00:00Z',
        venue: 'Diggi Palace',
        city: 'Jaipur',
        status: 'published',
        featured: true,
        is_online: false,
        description: 'The greatest literary show on Earth.',
      },
      {
        id: 'event-2',
        title: 'Virtual Book Reading',
        slug: 'virtual-book-reading',
        category_id: 'cat-1',
        start_at: '2027-03-15T18:00:00Z',
        city: 'Online',
        status: 'published',
        featured: false,
        is_online: true,
        description: 'Interactive online session with readers.',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'literary_event_categories') {
        const catBuilder: any = {
          select: vi.fn(() => catBuilder),
          eq: vi.fn(() => catBuilder),
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
        };
        return catBuilder;
      }
      if (table === 'literary_events') {
        const eventBuilder: any = {
          select: vi.fn(() => eventBuilder),
          eq: vi.fn(() => eventBuilder),
          gte: vi.fn(() => eventBuilder),
          order: vi.fn(() => eventBuilder),
          limit: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
        return eventBuilder;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders events page title and event cards', async () => {
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    expect(screen.getByText(/Books bring us/i)).toBeInTheDocument();
    expect(await screen.findByText('Jaipur Literature Festival')).toBeInTheDocument();
    expect(screen.getByText('Virtual Book Reading')).toBeInTheDocument();
  });

  it('filters events when searching in the search input', async () => {
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    expect(await screen.findByText('Jaipur Literature Festival')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search festivals, launches, authors/i);
    fireEvent.change(searchInput, { target: { value: 'Jaipur' } });

    expect(screen.getByText('Jaipur Literature Festival')).toBeInTheDocument();
    expect(screen.queryByText('Virtual Book Reading')).not.toBeInTheDocument();
  });

  it('filters events by category button selection', async () => {
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    expect(await screen.findByText('Jaipur Literature Festival')).toBeInTheDocument();

    const bookFairsFilter = screen.getByRole('button', { name: /Book Fairs/i });
    fireEvent.click(bookFairsFilter);

    expect(screen.getByText('Virtual Book Reading')).toBeInTheDocument();
    expect(screen.queryByText('Jaipur Literature Festival')).not.toBeInTheDocument();
  });
});
