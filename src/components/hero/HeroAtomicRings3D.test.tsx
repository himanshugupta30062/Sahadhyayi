import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroAtomicRings3D from '@/components/hero/HeroAtomicRings3D';

describe('HeroAtomicRings3D', () => {
  it('renders without errors and re-exports the canonical atomic rings sigil', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroAtomicRings3D />
      </MemoryRouter>
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
