import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import LoadingGrid from '@/components/library/LoadingGrid';

describe('LoadingGrid', () => {
  afterEach(() => cleanup());

  it('renders loading text and skeleton cards', () => {
    const { container } = render(<LoadingGrid />);
    expect(screen.getByText('Loading your books...')).toBeInTheDocument();
    const skeletons = container.querySelectorAll('.grid > div');
    expect(skeletons.length).toBe(8);
  });
});
