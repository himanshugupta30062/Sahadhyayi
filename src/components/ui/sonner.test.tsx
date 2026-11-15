import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import Toaster from '@/components/ui/sonner';

describe('Sonner Toaster', () => {
  afterEach(() => cleanup());

  it('renders the sonner toaster container', () => {
    const { container } = render(<Toaster />);
    expect(container).toBeInTheDocument();
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
