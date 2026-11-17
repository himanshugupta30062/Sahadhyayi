// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LifeStories from './LifeStories';
import { lifeStories } from '@/data/lifeStories';


const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('LifeStories', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => lifeStories }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders life stories directory with title and biographies', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MemoryRouter>
          <LifeStories />
        </MemoryRouter>
      </Wrapper>
    );

    expect(await screen.findByText(/Every life has a story/i)).toBeInTheDocument();
    expect(await screen.findByText('Kalpana Chawla')).toBeInTheDocument();
    expect(screen.getByText('Rabindranath Tagore')).toBeInTheDocument();
    expect(screen.getByText('Srinivasa Ramanujan')).toBeInTheDocument();
  });

  it('filters stories by search term', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MemoryRouter>
          <LifeStories />
        </MemoryRouter>
      </Wrapper>
    );

    await screen.findByText('Kalpana Chawla');
    const searchInput = screen.getByPlaceholderText(/Search.*journeys.*themes/i);
    fireEvent.change(searchInput, { target: { value: 'Ramanujan' } });

    expect(screen.getByText('Srinivasa Ramanujan')).toBeInTheDocument();
    expect(screen.queryByText('Kalpana Chawla')).not.toBeInTheDocument();
  });

  it('renders single life story detail page with lesson and source link', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/life-stories/kalpana-chawla']}>
          <Routes>
            <Route path="/life-stories/:slug" element={<LifeStories />} />
          </Routes>
        </MemoryRouter>
      </Wrapper>
    );

    expect(await screen.findByRole('heading', { name: 'Kalpana Chawla' })).toBeInTheDocument();
    expect(screen.getByText(/A thought to carry forward/i)).toBeInTheDocument();
    expect(screen.getByText('NASA biography')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Listen to Story/i })).toBeInTheDocument();
  });
});

