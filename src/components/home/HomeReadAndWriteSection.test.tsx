import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeReadAndWriteSection from './HomeReadAndWriteSection';

vi.mock('@/hooks/useArticles', () => ({
  usePublishedArticles: () => ({
    data: [
      {
        id: 'art-1',
        title: 'Modern Literary Theory',
        subtitle: 'An introduction to narrative forms',
        slug: 'modern-literary-theory',
        author_name: 'Dr. Jane Doe',
        reading_time_minutes: 5,
        tags: ['Theory'],
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useStories', () => ({
  useStories: () => ({
    data: [
      {
        id: 'story-1',
        title: 'Whispers of the Wind',
        description: 'A tale of an ancient town',
        author_name: 'John Writer',
        genre: 'Mystery',
        format: 'series',
      },
    ],
    isLoading: false,
  }),
}));

describe('HomeReadAndWriteSection', () => {
  it('renders articles tab by default with article cards and action links', () => {
    render(
      <MemoryRouter>
        <HomeReadAndWriteSection />
      </MemoryRouter>
    );

    // Section title
    expect(
      screen.getByRole('heading', { name: /Two distinct reading and publishing experiences/i })
    ).toBeInTheDocument();

    // Default active tab is Articles
    expect(screen.getByText('Modern Literary Theory')).toBeInTheDocument();
    expect(screen.getByText('By Dr. Jane Doe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Write an Article/i })).toHaveAttribute('href', '/articles/write');
    expect(screen.getByRole('link', { name: /Explore All Articles/i })).toHaveAttribute('href', '/articles');
  });

  it('switches to stories tab and displays story items and publish CTA', () => {
    render(
      <MemoryRouter>
        <HomeReadAndWriteSection />
      </MemoryRouter>
    );

    const storiesTab = screen.getByRole('button', { name: /Short Stories & Serials/i });
    fireEvent.click(storiesTab);

    expect(screen.getByText('Whispers of the Wind')).toBeInTheDocument();
    expect(screen.getByText('By John Writer')).toBeInTheDocument();
    expect(screen.getByText(/Multi-part Serial/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Publish Story/i })).toHaveAttribute('href', '/social?tab=stories');
    expect(screen.getByRole('link', { name: /Explore All Stories/i })).toHaveAttribute('href', '/stories');
  });
});
