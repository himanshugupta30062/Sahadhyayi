import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import Toggle from '@/components/ui/toggle';

describe('Toggle', () => {
  afterEach(() => cleanup());

  it('renders and toggles pressed state on click', () => {
    render(<Toggle aria-label="Toggle italic">Italic</Toggle>);

    const button = screen.getByRole('button', { name: 'Toggle italic' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-state', 'off');

    fireEvent.click(button);
    expect(button).toHaveAttribute('data-state', 'on');
  });

  it('applies variant and size classes', () => {
    render(
      <Toggle variant="outline" size="sm" aria-label="Toggle outline">
        Outline
      </Toggle>
    );
    const button = screen.getByRole('button', { name: 'Toggle outline' });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain('border');
  });
});
