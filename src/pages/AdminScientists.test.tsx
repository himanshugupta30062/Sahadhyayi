// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminScientists from './AdminScientists';
import { supabase } from '@/integrations/supabase/client';

describe('AdminScientists', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    window.scrollTo = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    const mockScientists = [
      {
        id: 'sci-1',
        slug: 'cv-raman',
        name: 'C. V. Raman',
        region: 'india',
        discipline: 'Physics',
        lifespan: '1888–1970',
        summary: 'Nobel laureate in Physics',
        status: 'published',
        profile_data: {
          initials: 'CV',
          headline: 'Pioneered Raman scattering',
          birthplace: 'Tiruchirappalli',
          knownFor: ['Raman effect'],
          lifeStory: ['Pioneering Indian physicist.'],
          work: [{ title: 'A New Radiation', description: 'Discovery of the Raman effect' }],
          milestones: [{ year: '1930', title: 'Nobel Prize', description: 'Awarded Nobel Prize in Physics' }],
          legacy: 'Transformed modern spectroscopy.',
          sources: [{ label: 'Nobel Prize', publisher: 'Nobel Foundation', url: 'https://nobelprize.org' }],
        },
        sort_order: 1,
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'scientists') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockScientists, error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockScientists[0], error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      if (table === 'scientist_publications' || table === 'scientist_archives') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders scientist management header and directory', async () => {
    render(
      <MemoryRouter>
        <AdminScientists />
      </MemoryRouter>
    );

    expect(screen.getByText('Scientists content manager')).toBeInTheDocument();
    expect(await screen.findByText('C. V. Raman')).toBeInTheDocument();
  });

  it('selects a scientist from the list to populate the editor form', async () => {
    render(
      <MemoryRouter>
        <AdminScientists />
      </MemoryRouter>
    );

    const scientistCard = await screen.findByText('C. V. Raman');
    fireEvent.click(scientistCard);

    await waitFor(() => {
      expect(screen.getByDisplayValue('C. V. Raman')).toBeInTheDocument();
      expect(screen.getByDisplayValue('cv-raman')).toBeInTheDocument();
    });
  });

  it('handles reset to empty editor state when clicking new scientist button', async () => {
    render(
      <MemoryRouter>
        <AdminScientists />
      </MemoryRouter>
    );

    const newButton = screen.getByRole('button', { name: /New scientist/i });
    fireEvent.click(newButton);

    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });
});
