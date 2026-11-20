import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AnimatedHero from './AnimatedHero';

describe('AnimatedHero', () => {
  it('renders the hero section, editorial content, and atomic rings sigil', () => {
    render(
      <MemoryRouter>
        <AnimatedHero />
      </MemoryRouter>
    );

    const heroSection = screen.getByRole('region', { name: /Sahadhyayi Hero/i });
    expect(heroSection).toBeInTheDocument();

    // Core sigil Devanagari text
    expect(screen.getByText('सहाध्यायी')).toBeInTheDocument();

    // Check for hero content elements
    expect(screen.getByText(/A Reading Community/i)).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Journey.')).toBeInTheDocument();
    expect(screen.getByText('Sahadhyayi')).toBeInTheDocument();
  });
});
