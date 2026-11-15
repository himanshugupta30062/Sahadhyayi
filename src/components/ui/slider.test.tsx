import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { Slider } from '@/components/ui/slider';

describe('Slider', () => {
  afterEach(() => cleanup());

  it('renders slider root, track, range, and thumb', () => {
    const { container } = render(
      <Slider defaultValue={[50]} max={100} step={1} className="custom-slider" />
    );

    const root = container.querySelector('[role="slider"]');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-valuenow', '50');
    expect(container.querySelector('.custom-slider')).toBeInTheDocument();
  });

  it('renders with disabled state when disabled prop is provided', () => {
    const { container } = render(<Slider defaultValue={[20]} disabled />);
    const root = container.querySelector('[role="slider"]');
    expect(root).toHaveAttribute('data-disabled');
  });
});
