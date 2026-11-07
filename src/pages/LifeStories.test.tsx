// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LifeStories from './LifeStories';

describe('LifeStories', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders life stories directory with title and biographies', () => {
    render(
      <MemoryRouter>
        <LifeStories />
      </MemoryRouter>
    );

    expect(screen.getByText(/Every life has a story/i)).toBeInTheDocument();
    expect(screen.getByText('Kalpana Chawla')).toBeInTheDocument();
    expect(screen.getByText('Rabindranath Tagore')).toBeInTheDocument();
    expect(screen.getByText('Srinivasa Ramanujan')).toBeInTheDocument();
  });

  it('filters stories by search term', () => {
    render(
      <MemoryRouter>
        <LifeStories />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search people, journeys, or themes/i);
    fireEvent.change(searchInput, { target: { value: 'Ramanujan' } });

    expect(screen.getByText('Srinivasa Ramanujan')).toBeInTheDocument();
    expect(screen.queryByText('Kalpana Chawla')).not.toBeInTheDocument();
  });

  it('renders single life story detail page with lesson and source link', () => {
    render(
      <MemoryRouter initialEntries={['/life-stories/kalpana-chawla']}>
        <Routes>
          <Route path="/life-stories/:slug" element={<LifeStories />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Kalpana Chawla' })).toBeInTheDocument();
    expect(screen.getByText(/A thought to carry forward/i)).toBeInTheDocument();
    expect(screen.getByText('NASA biography')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Listen to Story/i })).toBeInTheDocument();
  });
});

