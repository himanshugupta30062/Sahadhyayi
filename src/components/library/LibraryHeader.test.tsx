import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LibraryHeader from './LibraryHeader';

describe('LibraryHeader', () => {
  it('renders search input, calls onSearchChange, and renders view modes', () => {
    const onSearchChange = vi.fn();
    const onViewModeChange = vi.fn();
    const onSortChange = vi.fn();

    const { container } = render(
      <LibraryHeader
        searchQuery="Gita"
        onSearchChange={onSearchChange}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        sortBy="title"
        onSortChange={onSortChange}
      />
    );

    const input = screen.getByPlaceholderText(/search books by title, author, or genre/i);
    expect(input).toHaveValue('Gita');

    fireEvent.change(input, { target: { value: 'Mahabharata' } });
    expect(onSearchChange).toHaveBeenCalledWith('Mahabharata');

    const modeButtons = container.querySelectorAll('.border.rounded-lg button');
    expect(modeButtons.length).toBe(2);
    fireEvent.click(modeButtons[1]);
    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });
});
