import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { AspectRatio } from '@/components/ui/aspect-ratio';

describe('AspectRatio', () => {
  afterEach(() => cleanup());

  it('renders children with the specified aspect ratio container', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9} data-testid="aspect-ratio-box">
        <img src="/test.jpg" alt="Test image" />
      </AspectRatio>
    );

    const el = screen.getByTestId('aspect-ratio-box');
    expect(el).toBeInTheDocument();
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('defaults to ratio 1 if not specified', () => {
    render(
      <AspectRatio data-testid="default-ratio">
        <span>Content</span>
      </AspectRatio>
    );
    expect(screen.getByTestId('default-ratio')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
