/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroAtomicRings3D from '@/components/hero/HeroAtomicRings3D';

describe('HeroAtomicRings3D', () => {
  it('renders without crashing and falls back gracefully with full accessible links', () => {
    render(
      <MemoryRouter>
        <HeroAtomicRings3D>
          <div>Center Core Sigil</div>
        </HeroAtomicRings3D>
      </MemoryRouter>
    );

    expect(screen.getByRole('group', {
      name: /Explore Sahadhyayi through the Library, Authors, Social Media, Articles, and Games orbits/i
    })).toBeInTheDocument();

    expect(screen.getByText('Center Core Sigil')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Library/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Authors/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Social Media/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Articles/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Games/i })).toBeInTheDocument();
  });
});
