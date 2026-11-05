/** @vitest-environment jsdom */

import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/searchLibrary', () => ({
  searchLibrary: vi.fn().mockResolvedValue([]),
}));

import { useLibrarySearch } from './useLibrarySearch';
import { searchLibrary } from '@/lib/searchLibrary';

function HookHarness() {
  const search = useLibrarySearch();
  return (
    <div>
      <output data-testid="query">{search.query}</output>
      <output data-testid="language">{search.filters.lang ?? 'none'}</output>
      <output data-testid="genres">{search.filters.genres?.join(',') ?? 'none'}</output>
      <output data-testid="popularity">{search.filters.minPopularity ?? 'none'}</output>
      <button onClick={() => search.setFilters.setLang('hi')}>language</button>
      <button onClick={() => search.setFilters.setGenres(['fiction', 'history'])}>genres</button>
      <button onClick={() => search.setFilters.setMinPopularity(5)}>popularity</button>
      <button onClick={search.resetFilters}>reset</button>
      <button onClick={search.forceSearch}>search</button>
    </div>
  );
}

describe('useLibrarySearch filter actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initializes query and filters from the URL', () => {
    render(<MemoryRouter initialEntries={['/library?q=veda&lang=hi&genres=fiction,history&pop=4']}><HookHarness /></MemoryRouter>);
    expect(screen.getByTestId('query')).toHaveTextContent('veda');
    expect(screen.getByTestId('language')).toHaveTextContent('hi');
    expect(screen.getByTestId('genres')).toHaveTextContent('fiction,history');
    expect(screen.getByTestId('popularity')).toHaveTextContent('4');
  });

  it('updates each filter and resets them together', () => {
    render(<MemoryRouter><HookHarness /></MemoryRouter>);
    act(() => {
      screen.getByText('language').click();
      screen.getByText('genres').click();
      screen.getByText('popularity').click();
    });
    expect(screen.getByTestId('language')).toHaveTextContent('hi');
    expect(screen.getByTestId('genres')).toHaveTextContent('fiction,history');
    expect(screen.getByTestId('popularity')).toHaveTextContent('5');
    act(() => screen.getByText('reset').click());
    expect(screen.getByTestId('language')).toHaveTextContent('none');
    expect(screen.getByTestId('genres')).toHaveTextContent('none');
    expect(screen.getByTestId('popularity')).toHaveTextContent('none');
  });

  it('force-searches a non-empty query immediately', async () => {
    vi.useFakeTimers();
    render(<MemoryRouter initialEntries={['/library?q=arthashastra']}><HookHarness /></MemoryRouter>);
    await act(async () => {
      screen.getByText('search').click();
      await Promise.resolve();
    });
    expect(searchLibrary).toHaveBeenCalledWith('arthashastra', expect.objectContaining({
      lang: null, genres: null, minPopularity: null,
    }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    vi.useRealTimers();
  });
});
