// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Scientists from './Scientists';
import * as scientistsRepo from '@/lib/scientistsRepository';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}));

const mockProfiles = [
  {
    slug: 'cv-raman',
    name: 'C. V. Raman',
    initials: 'CVR',
    region: 'india' as const,
    discipline: 'Physics',
    lifespan: '1888–1970',
    birthplace: 'Tiruchirappalli, Tamil Nadu',
    headline: 'Pioneer of the Raman Effect',
    summary: 'Discovered the inelastic scattering of light.',
    knownFor: ['Raman Scattering', 'Nobel Prize 1930'],
    lifeStory: ['Early life and research at IACS.'],
    work: [{ title: 'Raman Effect', description: 'Scattering of light particles.' }],
    legacy: ['National Science Day in India.'],
    quotes: ['Treat me right and you will see the light.'],
    resources: [{ label: 'Nobel Lecture', url: 'https://nobelprize.org' }],
    timeline: [{ year: '1930', event: 'Awarded the Nobel Prize' }],
  },
  {
    slug: 'marie-curie',
    name: 'Marie Curie',
    initials: 'MC',
    region: 'world' as const,
    discipline: 'Physics & Chemistry',
    lifespan: '1867–1934',
    birthplace: 'Warsaw, Poland',
    headline: 'Pioneer of Radioactivity',
    summary: 'Discovered polonium and radium.',
    knownFor: ['Radioactivity', 'Two Nobel Prizes'],
    lifeStory: ['Studied at the Sorbonne.'],
    work: [{ title: 'Isolation of Radium', description: 'Separated radium salts.' }],
    legacy: ['First woman to win a Nobel Prize.'],
    quotes: ['Nothing in life is to be feared, it is only to be understood.'],
    resources: [{ label: 'Curie Institute', url: 'https://curie.fr' }],
    timeline: [{ year: '1903', event: 'Awarded the Nobel Prize in Physics' }],
  },
];

describe('Scientists', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(scientistsRepo, 'fetchScientistProfiles').mockResolvedValue(mockProfiles as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Indian scientists by default', async () => {
    render(
      <MemoryRouter>
        <Scientists />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Great minds/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'C. V. Raman' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Marie Curie' })).not.toBeInTheDocument();
  });

  it('switches between Indian and Global collections', async () => {
    render(
      <MemoryRouter>
        <Scientists />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'C. V. Raman' })).toBeInTheDocument();
    });

    // Click on "Around the World"
    const worldTab = screen.getByRole('tab', { name: /Around the World/i });
    fireEvent.click(worldTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Marie Curie' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'C. V. Raman' })).not.toBeInTheDocument();
  });

  it('filters scientists by search query and shows empty state', async () => {
    render(
      <MemoryRouter>
        <Scientists />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'C. V. Raman' })).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: 'Search scientists' });
    fireEvent.change(searchInput, { target: { value: 'Quantum' } });

    expect(screen.getByRole('heading', { name: 'No scientists found' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'C. V. Raman' })).toBeInTheDocument();
    });
  });
});
