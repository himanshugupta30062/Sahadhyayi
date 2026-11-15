import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import HeroLoader from '@/components/hero/HeroLoader';

describe('HeroLoader', () => {
  afterEach(() => cleanup());

  it('renders loading text and loader layout', () => {
    render(<HeroLoader />);
    expect(screen.getByText('Welcome to Sahadhyayi...')).toBeInTheDocument();
  });
});
