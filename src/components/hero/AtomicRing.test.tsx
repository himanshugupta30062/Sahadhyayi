import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { AtomicRing } from '@/components/hero/AtomicRing';

describe('AtomicRing', () => {
  afterEach(() => cleanup());

  it('renders SVG arc with correct radius, strokeWidth, and gradient', () => {
    const { container } = render(
      <AtomicRing
        radius={100}
        color="url(#ring-gradient-outer)"
        rotation={45}
        duration={12}
        strokeWidth={20}
        isPaused={false}
        gapDegrees={10}
        glow={3}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');

    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('stroke', 'url(#ring-gradient-outer)');
    expect(path).toHaveAttribute('stroke-width', '20');
    expect(path).toHaveAttribute('filter', 'url(#ring-glow-100)');
  });

  it('respects isPaused prop by pausing animation', () => {
    const { container } = render(
      <AtomicRing
        radius={80}
        color="#fff"
        rotation={0}
        duration={8}
        isPaused={true}
      />
    );

    const div = container.firstChild as HTMLElement;
    expect(div.style.animationPlayState).toBe('paused');
  });
});
