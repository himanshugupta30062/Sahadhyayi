import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import HeroAtomicRings from './HeroAtomicRings';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HeroAtomicRings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all five orbital feature nodes with labels and links', () => {
    render(
      <MemoryRouter>
        <HeroAtomicRings>
          <div data-testid="center-sigil">Core Sigil</div>
        </HeroAtomicRings>
      </MemoryRouter>
    );

    expect(screen.getByTestId('center-sigil')).toBeInTheDocument();

    const expectedOrbits = [
      'Explore Library',
      'Explore Authors',
      'Explore Social Media',
      'Explore Articles',
      'Explore Games',
    ];

    expectedOrbits.forEach((name) => {
      const link = screen.getByRole('link', { name: new RegExp(name, 'i') });
      expect(link).toBeInTheDocument();
    });
  });

  it('handles click and keyboard navigation on interactive orbital nodes', () => {
    render(
      <MemoryRouter>
        <HeroAtomicRings />
      </MemoryRouter>
    );

    const libraryLink = screen.getByRole('link', { name: /Explore Library/i });
    expect(libraryLink).toBeInTheDocument();

    // Click navigation
    fireEvent.click(libraryLink);
    expect(mockNavigate).toHaveBeenCalledWith('/library');

    // Keyboard navigation (Enter)
    const authorsLink = screen.getByRole('link', { name: /Explore Authors/i });
    fireEvent.keyDown(authorsLink, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/authors');

    // Keyboard navigation (Space)
    const gamesLink = screen.getByRole('link', { name: /Explore Games/i });
    fireEvent.keyDown(gamesLink, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/games');
  });

  it('pauses and resumes animation on keyboard focus and blur', () => {
    render(
      <MemoryRouter>
        <HeroAtomicRings />
      </MemoryRouter>
    );

    const socialLink = screen.getByRole('link', { name: /Explore Social Media/i });
    fireEvent.focus(socialLink);
    fireEvent.blur(socialLink);
  });
});
