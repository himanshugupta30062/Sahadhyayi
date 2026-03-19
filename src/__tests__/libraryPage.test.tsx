/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('@/hooks/useCommunityStats', () => ({
  useCommunityStats: () => ({
    stats: { totalSignups: 1234 },
  }),
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb" />,
}));

vi.mock('@/components/library/SortingInfoTooltip', () => ({
  default: () => <div data-testid="sorting-info" />,
}));

vi.mock('@/components/library/LibraryHero', () => ({
  default: ({ searchQuery, onSearchChange, onSearch }: {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearch: () => void;
  }) => (
    <div>
      <div data-testid="hero-query">{searchQuery}</div>
      <button onClick={() => onSearchChange('updated query')}>change query</button>
      <button onClick={onSearch}>run search</button>
    </div>
  ),
}));

vi.mock('@/components/library/BooksCollection', () => ({
  default: ({ searchQuery, selectedGenre, selectedLanguage }: {
    searchQuery: string;
    selectedGenre: string;
    selectedLanguage: string;
  }) => (
    <div>
      <div data-testid="collection-query">{searchQuery}</div>
      <div data-testid="collection-genre">{selectedGenre}</div>
      <div data-testid="collection-language">{selectedLanguage}</div>
    </div>
  ),
}));

import Library from '@/pages/library';


const LocationSearch = () => {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
};

afterEach(() => {
  cleanup();
});

describe('Library page', () => {
  it('hydrates search and filter state from URL params', () => {
    render(
      <MemoryRouter initialEntries={['/library?search=history&genre=Science&language=Hindi']}>
        <Routes>
          <Route path="/library" element={<><LocationSearch /><Library /></>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('hero-query')).toHaveTextContent('history');
    expect(screen.getByTestId('collection-query')).toHaveTextContent('history');
    expect(screen.getByTestId('collection-genre')).toHaveTextContent('Science');
    expect(screen.getByTestId('collection-language')).toHaveTextContent('Hindi');
    expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
  });

  it('updates the URL when a new hero search is submitted', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <Routes>
          <Route path="/library" element={<><LocationSearch /><Library /></>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /change query/i }));
    fireEvent.click(screen.getByRole('button', { name: /run search/i }));

    expect(screen.getByTestId('collection-query')).toHaveTextContent('updated query');
    expect(screen.getByTestId('location-search')).toHaveTextContent('?search=updated+query');
  });
});
