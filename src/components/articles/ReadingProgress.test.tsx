import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingProgress from './ReadingProgress';

describe('ReadingProgress', () => {
  it('renders progressbar with initial value', () => {
    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar', { name: /reading progress/i });
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');

    // Trigger scroll and resize event listeners
    fireEvent.scroll(window);
    fireEvent.resize(window);
  });
});
