// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EventCard } from './EventCard';
import { useAuth } from '@/contexts/authHelpers';
import * as authorEventsHook from '@/hooks/useAuthorEvents';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('EventCard', () => {
  const mockUpdateAttendance = vi.fn();
  const mockEvent: authorEventsHook.AuthorEvent = {
    id: 'event-1',
    author_id: 'author-1',
    title: 'Book Signing with Author',
    description: 'Come get your book signed!',
    event_type: 'signing',
    start_date: '2026-12-01T14:00:00Z',
    end_date: '2026-12-01T16:00:00Z',
    location: 'Central Library, New Delhi',
    event_url: 'https://example.com/event',
    is_published: true,
    max_attendees: 50,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authorEventsHook, 'useEventAttendance').mockReturnValue({
      data: [{ id: 'att-1', event_id: 'event-1', user_id: 'user-1', status: 'attending' }],
      updateAttendance: mockUpdateAttendance,
      isUpdating: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders event details properly', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    render(<EventCard event={mockEvent} />);

    expect(screen.getByText('Book Signing with Author')).toBeInTheDocument();
    expect(screen.getByText('Come get your book signed!')).toBeInTheDocument();
    expect(screen.getByText('Central Library, New Delhi')).toBeInTheDocument();
    expect(screen.getByText(/1 person interested/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Details/i })).toHaveAttribute('href', 'https://example.com/event');
  });

  it('allows authenticated user to change attendance status', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);

    render(<EventCard event={mockEvent} />);

    const interestedBtn = screen.getByRole('button', { name: /Interested/i });
    fireEvent.click(interestedBtn);

    expect(mockUpdateAttendance).toHaveBeenCalledWith({ status: 'interested' });
  });
});

