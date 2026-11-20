import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeActivityHubSection from './HomeActivityHubSection';

vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => ({
    data: [
      { id: 'group-1', name: 'Philosophy Circle' },
      { id: 'group-2', name: 'Sci-Fi Readers' },
    ],
    isLoading: false,
  }),
}));

describe('HomeActivityHubSection', () => {
  it('renders section header and 4 core destination cards', () => {
    render(
      <MemoryRouter>
        <HomeActivityHubSection />
      </MemoryRouter>
    );

    // Section title
    expect(
      screen.getByRole('heading', { name: /Activity Hub: Games, challenges & meetups/i })
    ).toBeInTheDocument();

    // 4 activity cards
    expect(screen.getByRole('heading', { name: 'Book Games & Trivia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reading Challenges' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reading Groups' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Events & Festivals' })).toBeInTheDocument();

    // Destination links
    expect(screen.getByRole('link', { name: /Explore all activities/i })).toHaveAttribute('href', '/activity');
    expect(screen.getByRole('link', { name: /Play book quizzes/i })).toHaveAttribute('href', '/games');
    expect(screen.getByRole('link', { name: /Join a challenge/i })).toHaveAttribute('href', '/activity?tab=challenges');
    expect(screen.getByRole('link', { name: /Explore reading circles/i })).toHaveAttribute('href', '/social?tab=groups');
    expect(screen.getByRole('link', { name: /View event calendar/i })).toHaveAttribute('href', '/events');
  });

  it('renders featured upcoming festival spotlight banner', () => {
    render(
      <MemoryRouter>
        <HomeActivityHubSection />
      </MemoryRouter>
    );

    expect(screen.getByText(/Featured Upcoming Festival/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /RSVP & View Details/i })).toBeInTheDocument();
  });
});
