// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeReadingPeopleSection from '@/components/home/HomeReadingPeopleSection';

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => ({ data: [] }),
}));

describe('HomeReadingPeopleSection: Books connect us. See readers around you.', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <HomeReadingPeopleSection />
      </MemoryRouter>
    );
  }

  it('renders signature headline, feature pillars, and interactive map preview', () => {
    renderComponent();

    // Check main headline & signature pill
    expect(screen.getByText(/Books connect us\./i)).toBeInTheDocument();
    expect(screen.getByText(/See readers around you\./i)).toBeInTheDocument();
    expect(screen.getByText(/Sahadhyayi signature feature/i)).toBeInTheDocument();

    // Check 3 functional clarity pillars
    expect(screen.getByText(/City Radar/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Book Mates/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Zero Risk/i)).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByRole('link', { name: /explore readers map/i })).toHaveAttribute('href', '/map');
    expect(screen.getByRole('link', { name: /find readers by book/i })).toHaveAttribute('href', '/reader-map');

    // Check default reader preview is visible
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getAllByText(/Gunaho Ka Devta/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3.4 km away/i).length).toBeGreaterThan(0);
  });

  it('switches between City and Book modes and changes reader selection on pin click', () => {
    renderComponent();

    // Switch to 'By Book: Gunaho Ka Devta' mode
    const bookModeBtn = screen.getByRole('button', { name: /By Book: Gunaho Ka Devta/i });
    fireEvent.click(bookModeBtn);

    // In book mode, Rohan Verma is now selected by default
    expect(screen.getByText('Rohan Verma')).toBeInTheDocument();
    expect(screen.getByText(/Bengaluru \(Online\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Same book mate/i)).toBeInTheDocument();

    // Click on Vikramaditya Roy pin
    const vrPin = screen.getByTitle(/Click to view Vikramaditya Roy/i);
    fireEvent.click(vrPin);

    // Active reader card updates to Vikramaditya Roy
    expect(screen.getByText('Vikramaditya Roy')).toBeInTheDocument();
    expect(screen.getByText(/Mumbai \(Online\)/i)).toBeInTheDocument();
  });
});
