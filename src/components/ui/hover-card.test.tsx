import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';

describe('HoverCard UI', () => {
  it('renders hover card trigger', () => {
    render(
      <HoverCard open={true}>
        <HoverCardTrigger asChild>
          <a href="#test">Hover me</a>
        </HoverCardTrigger>
        <HoverCardContent className="custom-hover">
          Hover Content
        </HoverCardContent>
      </HoverCard>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
});
