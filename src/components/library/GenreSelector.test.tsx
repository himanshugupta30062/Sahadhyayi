import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenreSelector from './GenreSelector';

describe('GenreSelector', () => {
  it('renders all genres and triggers onSelect when clicked', () => {
    const onSelect = vi.fn();
    const genres = ['All', 'Fiction', 'Philosophy', 'Science'];

    render(<GenreSelector genres={genres} selected="Philosophy" onSelect={onSelect} />);

    const philosophyBtn = screen.getByRole('button', { name: 'Philosophy' });
    expect(philosophyBtn).toHaveAttribute('aria-pressed', 'true');

    const fictionBtn = screen.getByRole('button', { name: 'Fiction' });
    expect(fictionBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(fictionBtn);
    expect(onSelect).toHaveBeenCalledWith('Fiction');
  });
});
