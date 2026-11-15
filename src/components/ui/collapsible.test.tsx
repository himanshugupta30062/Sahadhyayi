import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

describe('Collapsible', () => {
  afterEach(() => cleanup());

  it('renders closed by default and toggles on trigger click', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Hidden Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveAttribute('data-state', 'closed');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('supports defaultOpen prop', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Already Open</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByTestId('trigger')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
