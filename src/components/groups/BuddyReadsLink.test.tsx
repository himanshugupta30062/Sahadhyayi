import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BuddyReadsLink from './BuddyReadsLink';

describe('BuddyReadsLink', () => {
  it('renders link to /buddy-reads with icon and text', () => {
    render(
      <MemoryRouter>
        <BuddyReadsLink />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /buddy reads/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/buddy-reads');
  });
});
