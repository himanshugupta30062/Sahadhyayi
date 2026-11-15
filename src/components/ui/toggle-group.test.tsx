import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

describe('ToggleGroup', () => {
  afterEach(() => cleanup());

  it('renders single-select toggle group and handles selection', () => {
    render(
      <ToggleGroup type="single" defaultValue="a">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>
    );

    const btnA = screen.getByRole('radio', { name: 'Option A' });
    const btnB = screen.getByRole('radio', { name: 'Option B' });

    expect(btnA).toHaveAttribute('data-state', 'on');
    expect(btnB).toHaveAttribute('data-state', 'off');

    fireEvent.click(btnB);
    expect(btnB).toHaveAttribute('data-state', 'on');
  });

  it('renders multiple-select toggle group', () => {
    render(
      <ToggleGroup type="multiple" variant="outline" size="sm">
        <ToggleGroupItem value="bold" aria-label="Bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>
    );

    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });

    expect(bold).toHaveAttribute('data-state', 'off');
    fireEvent.click(bold);
    expect(bold).toHaveAttribute('data-state', 'on');

    fireEvent.click(italic);
    expect(italic).toHaveAttribute('data-state', 'on');
    expect(bold).toHaveAttribute('data-state', 'on');
  });
});
