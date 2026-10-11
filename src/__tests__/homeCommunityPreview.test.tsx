/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeCommunityPreview from '@/components/home/HomeCommunityPreview';

const mockUseGroups = vi.fn();
const mockUseReadingRooms = vi.fn();
const mockUseMarginNotes = vi.fn();

vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => mockUseGroups(),
}));

vi.mock('@/hooks/useReadingRoom', () => ({
  useReadingRooms: () => mockUseReadingRooms(),
}));

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: (opts?: any) => mockUseMarginNotes(opts),
}));

describe('HomeCommunityPreview component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders section headline, description, and link to full community', () => {
    mockUseGroups.mockReturnValue({ data: [], isLoading: false });
    mockUseReadingRooms.mockReturnValue({ data: [], isLoading: false });
    mockUseMarginNotes.mockReturnValue({ data: [], isLoading: false });

    render(
      <MemoryRouter>
        <HomeCommunityPreview />
      </MemoryRouter>
    );

    expect(screen.getByText('Reading is better together')).toBeInTheDocument();
    expect(
      screen.getByText("Share what you're reading, exchange ideas, and find people who see the world through books.")
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore full community/i })).toHaveAttribute('href', '/social');
  });

  it('renders honest empty states with meaningful CTAs when arrays are empty', () => {
    mockUseGroups.mockReturnValue({ data: [], isLoading: false });
    mockUseReadingRooms.mockReturnValue({ data: [], isLoading: false });
    mockUseMarginNotes.mockReturnValue({ data: [], isLoading: false });

    render(
      <MemoryRouter>
        <HomeCommunityPreview />
      </MemoryRouter>
    );

    expect(screen.getByText('No groups created yet')).toBeInTheDocument();
    expect(screen.getByText('No live sprint running right now')).toBeInTheDocument();
    expect(screen.getByText('No public margin notes yet')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /open reading room/i })).toHaveAttribute('href', '/social?tab=rooms');
    expect(screen.getByRole('link', { name: /browse margins/i })).toHaveAttribute('href', '/social?tab=margins');
  });

  it('renders active items and valid navigation links when data exists', () => {
    mockUseGroups.mockReturnValue({
      data: [
        {
          id: 'group-1',
          name: 'Sci-Fi Explorers',
          description: 'Exploring speculative fiction and hard science fiction.',
          group_members: [{ count: 12 }],
        },
      ],
      isLoading: false,
    });

    mockUseReadingRooms.mockReturnValue({
      data: [
        {
          id: 'room-1',
          name: 'Evening Deep Work',
          books_library: {
            title: 'Dune',
            author: 'Frank Herbert',
          },
        },
      ],
      isLoading: false,
    });

    mockUseMarginNotes.mockReturnValue({
      data: [
        {
          id: 'note-1',
          quote: 'Fear is the mind-killer.',
          page: 42,
          books_library: {
            title: 'Dune',
          },
          profiles: {
            full_name: 'Paul Atreides',
          },
        },
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <HomeCommunityPreview />
      </MemoryRouter>
    );

    // Group checks
    expect(screen.getByText('Sci-Fi Explorers')).toBeInTheDocument();
    expect(screen.getByText('12 members')).toBeInTheDocument();

    // Reading room checks
    expect(screen.getByText('Evening Deep Work')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText(/Frank Herbert/)).toBeInTheDocument();

    // Marginalia checks
    expect(screen.getByText('"Fear is the mind-killer."')).toBeInTheDocument();
    expect(screen.getByText('Dune · p. 42')).toBeInTheDocument();
    expect(screen.getByText('by Paul Atreides')).toBeInTheDocument();
  });
});
