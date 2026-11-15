import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderStars } from './starRating';

describe('renderStars', () => {
  it('renders 5 stars total with correct full and empty count for whole numbers', () => {
    const stars = renderStars(4);
    const { container } = render(<div>{stars}</div>);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(5);
    const filled = container.querySelectorAll('.fill-yellow-400');
    expect(filled.length).toBe(4);
  });

  it('handles 0 rating', () => {
    const stars = renderStars(0);
    const { container } = render(<div>{stars}</div>);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(5);
    const filled = container.querySelectorAll('.fill-yellow-400');
    expect(filled.length).toBe(0);
  });

  it('floors fractional ratings', () => {
    const stars = renderStars(3.8);
    const { container } = render(<div>{stars}</div>);
    const filled = container.querySelectorAll('.fill-yellow-400');
    expect(filled.length).toBe(3);
  });
});
