// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResearchCitationNetwork from './ResearchCitationNetwork';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

describe('ResearchCitationNetwork', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays an error for invalid work identifier', async () => {
    render(
      <MemoryRouter initialEntries={['/research-network/invalid-id']}>
        <Routes>
          <Route path="/research-network/:workId" element={<ResearchCitationNetwork />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid OpenAlex work identifier/i);
  });

  it('fetches and renders paper details, references, and citing works', async () => {
    const rootWork = {
      id: 'https://openalex.org/W12345',
      title: 'Quantum Entanglement in Complex Systems',
      publication_year: 2021,
      cited_by_count: 50,
      doi: 'https://doi.org/10.1000/182',
      authorships: [{ author: { display_name: 'Dr. Quantum' } }],
      referenced_works: ['https://openalex.org/W999'],
    };

    const refWorksResponse = {
      results: [
        {
          id: 'https://openalex.org/W999',
          title: 'Foundations of Modern Physics',
          publication_year: 2010,
          cited_by_count: 120,
          doi: null,
          authorships: [{ author: { display_name: 'Isaac Newton' } }],
        },
      ],
    };

    const citingWorksResponse = {
      results: [
        {
          id: 'https://openalex.org/W555',
          title: 'Applications of Entanglement',
          publication_year: 2023,
          cited_by_count: 5,
          doi: null,
          authorships: [{ author: { display_name: 'Marie Curie' } }],
        },
      ],
      meta: { count: 50 },
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('https://openalex.org/W12345?select=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(rootWork),
        });
      }
      if (url.includes('filter=openalex_id:')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(refWorksResponse),
        });
      }
      if (url.includes('filter=cites:W12345')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(citingWorksResponse),
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    vi.stubGlobal('fetch', mockFetch);

    render(
      <MemoryRouter initialEntries={['/research-network/W12345']}>
        <Routes>
          <Route path="/research-network/:workId" element={<ResearchCitationNetwork />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Quantum Entanglement in Complex Systems' })).toBeInTheDocument();
    expect(screen.getByText('Foundations of Modern Physics')).toBeInTheDocument();
    expect(screen.getByText('Applications of Entanglement')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <MemoryRouter initialEntries={['/research-network/W12345']}>
        <Routes>
          <Route path="/research-network/:workId" element={<ResearchCitationNetwork />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/rate-limiting requests/i);
  });
});
