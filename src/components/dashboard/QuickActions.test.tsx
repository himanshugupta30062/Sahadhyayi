import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickActions from './QuickActions';

describe('QuickActions', () => {
  it('renders all quick action cards and links', () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Start Reading')).toBeInTheDocument();
    expect(screen.getByText('Write Story')).toBeInTheDocument();
    expect(screen.getByText('Join Groups')).toBeInTheDocument();
    expect(screen.getByText('Browse Library')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4);
    expect(links[0]).toHaveAttribute('href', '/bookshelf');
  });
});
