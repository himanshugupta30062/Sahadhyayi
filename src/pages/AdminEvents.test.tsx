// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminEvents from './AdminEvents';
import { supabase } from '@/integrations/supabase/client';

describe('AdminEvents', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    window.scrollTo = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    const mockCategories = [
      { id: 'cat-1', name: 'Book Fairs', slug: 'book-fairs' },
    ];
    const mockEvents = [
      {
        id: 'event-1',
        title: 'New Delhi World Book Fair 2027',
        slug: 'new-delhi-world-book-fair-2027',
        start_at: '2027-02-10T10:00:00Z',
        city: 'New Delhi',
        status: 'published',
        featured: true,
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'literary_event_categories') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
          }),
        } as any;
      }
      if (table === 'literary_events') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockEvents[0],
                  description: 'Annual fair',
                  category_id: 'cat-1',
                  start_at: '2027-02-10T10:00',
                  official_source_url: 'https://example.com',
                },
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders event management header and existing events', async () => {
    render(<AdminEvents />);

    expect(screen.getByText('Manage book events')).toBeInTheDocument();
    expect(await screen.findByText('New Delhi World Book Fair 2027')).toBeInTheDocument();
    expect(screen.getAllByText(/New Delhi/).length).toBeGreaterThanOrEqual(1);
  });

  it('populates form for editing when Edit button is clicked', async () => {
    render(<AdminEvents />);

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('New Delhi World Book Fair 2027')).toBeInTheDocument();
    });
  });

  it('deletes an event when Delete button is clicked', async () => {
    render(<AdminEvents />);

    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Delete this event permanently?');
    });
  });
});
