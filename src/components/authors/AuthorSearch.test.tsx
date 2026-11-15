import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthorSearch from './AuthorSearch';

describe('AuthorSearch', () => {
  it('renders search input and responds to change events', () => {
    const setSearchTerm = vi.fn();
    const setSortOption = vi.fn();

    render(
      <AuthorSearch
        searchTerm="Orwell"
        setSearchTerm={setSearchTerm}
        sortOption="rating"
        setSortOption={setSortOption}
      />
    );

    const input = screen.getByPlaceholderText(/search authors by name/i);
    expect(input).toHaveValue('Orwell');

    fireEvent.change(input, { target: { value: 'Tolkien' } });
    expect(setSearchTerm).toHaveBeenCalledWith('Tolkien');
  });
});
