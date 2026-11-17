// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ScientistProfile from './ScientistProfile';
import * as scientistsRepo from '@/lib/scientistsRepository';

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
    portrait: {
      imageUrl: 'https://images.example/raman.jpg',
      alt: 'Portrait of C. V. Raman',
      credit: 'Test credit',
      rights: 'Test rights',
      sourceUrl: 'https://images.example/source',
    },
    publications: [{
      title: 'A New Type of Secondary Radiation',
      year: '1928',
      venue: 'Nature, 121, 501–502',
      authors: 'C. V. Raman and K. S. Krishnan',
      doi: '10.1038/121501c0',
      url: 'https://www.nature.com/articles/121501c0',
      access: 'publisher' as const,
      note: 'Original research paper.',
    }],
    archives: [{
      title: 'Raman archive',
      institution: 'Indian Academy of Sciences',
      url: 'https://www.ias.ac.in/',
      material: 'Historical records',
      note: 'Institutional archive.',
    }],
    sources: [
      { label: 'Nobel Lecture', publisher: 'Nobel Foundation', url: 'https://nobelprize.org' },
      { label: 'Unsafe source', publisher: 'Untrusted', url: 'javascript:alert(1)' },
    ],
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

    await waitFor(() => {
      expect(document.head.querySelector('script[data-seo-schema="true"]')).toBeInTheDocument();
    });
    const schemaScript = document.head.querySelector('script[data-seo-schema="true"]');
    const schema = JSON.parse(schemaScript?.textContent || '{}');
    const person = schema['@graph']?.find((entry: Record<string, unknown>) => entry['@type'] === 'Person');

    expect(person).toMatchObject({
      '@id': 'https://sahadhyayi.com/scientists/cv-raman#person',
      name: 'C. V. Raman',
      image: 'https://images.example/raman.jpg',
      birthPlace: { '@type': 'Place', name: 'Tiruchirappalli, Tamil Nadu' },
    });
    expect(person.subjectOf).toEqual(expect.arrayContaining([
      expect.objectContaining({
        '@type': 'ScholarlyArticle',
        name: 'A New Type of Secondary Radiation',
        url: 'https://www.nature.com/articles/121501c0',
        identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: '10.1038/121501c0' },
      }),
      expect.objectContaining({
        '@type': 'CreativeWork',
        name: 'Raman archive',
        publisher: 'Indian Academy of Sciences',
      }),
      expect.objectContaining({ '@type': 'CreativeWork', name: 'Nobel Lecture' }),
    ]));
    expect(JSON.stringify(person.subjectOf)).not.toContain('javascript:');
    expect(schema['@graph']).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'BreadcrumbList' }),
    ]));
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
