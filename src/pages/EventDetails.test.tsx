// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetails from './EventDetails';
import { supabase } from '@/integrations/supabase/client';

describe('EventDetails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockEvent = {
      id: 'event-1',
      title: 'Jaipur Literature Festival 2027',
      slug: 'jaipur-literature-festival-2027',
      category_id: 'cat-1',
      start_at: '2027-01-20T10:00:00Z',
      end_at: '2027-01-24T18:00:00Z',
      venue: 'Diggi Palace',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      status: 'published',
      featured: true,
      is_online: false,
      description: 'The greatest literary show on Earth.',
      official_source_url: 'https://jaipurliteraturefestival.org',
      registration_url: 'https://jaipurliteraturefestival.org/register',
      organizer_name: 'Teamwork Arts',
    };

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'literary_events') {
        const query: any = {
          select: vi.fn(() => query),
          eq: vi.fn((field: string, val: any) => {
            if (field === 'slug' && val === 'non-existent') {
              return {
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              };
            }
            return query;
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
        };
        return query;
      }
      if (table === 'literary_event_categories') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Literature Festivals' }, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders event details including title, venue and source links', async () => {
    render(
      <MemoryRouter initialEntries={['/events/jaipur-literature-festival-2027']}>
        <Routes>
          <Route path="/events/:slug" element={<EventDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Jaipur Literature Festival 2027' })).toBeInTheDocument();
    expect(screen.getByText('Literature Festivals')).toBeInTheDocument();
    expect(screen.getByText(/Diggi Palace/)).toBeInTheDocument();
    expect(screen.getByText(/The greatest literary show on Earth/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Official event source/i })).toHaveAttribute(
      'href',
      'https://jaipurliteraturefestival.org'
    );
  });

  it('renders event not found when query returns no record', async () => {
    render(
      <MemoryRouter initialEntries={['/events/non-existent']}>
        <Routes>
          <Route path="/events/:slug" element={<EventDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Event not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Events/i })).toBeInTheDocument();
  });
});

