// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ScientistProfile from './ScientistProfile';
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
    legacy: 'National Science Day in India is celebrated in honour of his discovery.',
    milestones: [{ year: '1930', title: 'Nobel Prize', description: 'Awarded the Nobel Prize in Physics' }],
    sources: [{ label: 'Nobel Lecture', publisher: 'Nobel Foundation', url: 'https://nobelprize.org' }],
  },
  {
    slug: 'homi-bhabha',
    name: 'Homi Jehangir Bhabha',
    initials: 'HJB',
    region: 'india' as const,
    discipline: 'Nuclear Physics',
    lifespan: '1909–1966',
    birthplace: 'Bombay',
    headline: 'Father of the Indian Nuclear Programme',
    summary: 'Theoretical physicist.',
    knownFor: ['Bhabha Scattering'],
    lifeStory: ['Cambridge research.'],
    work: [{ title: 'Bhabha Scattering', description: 'Cross section of electron-positron scattering.' }],
    legacy: 'Built institutions that powered Indian scientific research.',
    milestones: [{ year: '1945', title: 'TIFR', description: 'Founded TIFR' }],
    sources: [{ label: 'TIFR archives', publisher: 'TIFR', url: 'https://tifr.res.in' }],
  },
];

describe('ScientistProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(scientistsRepo, 'fetchScientistProfiles').mockResolvedValue(mockProfiles as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders scientist profile details when found', async () => {
    render(
      <MemoryRouter initialEntries={['/scientists/cv-raman']}>
        <Routes>
          <Route path="/scientists/:slug" element={<ScientistProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'C. V. Raman' })).toBeInTheDocument();
    });

    expect(screen.getByText('Pioneer of the Raman Effect')).toBeInTheDocument();
    expect(screen.getByText('Early life and research at IACS.')).toBeInTheDocument();
    expect(screen.getByText(/National Science Day in India/i)).toBeInTheDocument();
  });

  it('renders not found state when slug does not match any profile', async () => {
    render(
      <MemoryRouter initialEntries={['/scientists/unknown-person']}>
        <Routes>
          <Route path="/scientists/:slug" element={<ScientistProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scientist profile not found' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Back to scientists/i })).toHaveAttribute('href', '/scientists');
  });
});
