import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeExploreCategories from './HomeExploreCategories';

describe('HomeExploreCategories', () => {
  it('renders section header and all 6 platform space cards', () => {
    render(
      <MemoryRouter>
        <HomeExploreCategories />
      </MemoryRouter>
    );

    // Section title
    expect(
      screen.getByRole('heading', { name: /Everything built for the deep reader/i })
    ).toBeInTheDocument();

    // 6 feature category cards
    expect(screen.getByRole('heading', { name: 'Discover & Read' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Social Feed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Read & Write' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Authors & Experts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Book Expert AI' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Activity Hub' })).toBeInTheDocument();

    // Mission link
    expect(screen.getByRole('link', { name: /Learn about our mission/i })).toHaveAttribute('href', '/about');

    // Shortcuts inside cards
    expect(screen.getByRole('link', { name: 'Digital Library' })).toHaveAttribute('href', '/library');
    expect(screen.getByRole('link', { name: 'Ask Book Expert' })).toHaveAttribute('href', '/book-expert');
    expect(screen.getByRole('link', { name: 'Reviewers & Critics' })).toHaveAttribute('href', '/reviewers-critics');
  });
});
