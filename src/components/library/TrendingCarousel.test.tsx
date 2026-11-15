import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrendingCarousel from './TrendingCarousel';

describe('TrendingCarousel', () => {
  it('renders trending books carousel with titles and ratings', () => {
    render(
      <MemoryRouter>
        <TrendingCarousel />
      </MemoryRouter>
    );

    expect(screen.getByText('Trending Books')).toBeInTheDocument();
    expect(screen.getByText('The Seven Husbands of Evelyn Hugo')).toBeInTheDocument();
    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
  });
});
