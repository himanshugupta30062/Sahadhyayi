import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookCardGrid from './BookCardGrid';

describe('BookCardGrid', () => {
  it('renders mock books and toggles read status button', () => {
    render(
      <MemoryRouter>
        <BookCardGrid />
      </MemoryRouter>
    );

    expect(screen.getByText('Learning React')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Patterns')).toBeInTheDocument();

    const aboutButtons = screen.getAllByRole('button', { name: /about/i });
    expect(aboutButtons.length).toBe(3);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/book/1');
  });
});
