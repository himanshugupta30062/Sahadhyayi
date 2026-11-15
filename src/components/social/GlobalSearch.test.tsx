import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalSearch } from './GlobalSearch';

describe('GlobalSearch', () => {
  it('renders search dialog and responds to search input', () => {
    const onClose = vi.fn();
    render(<GlobalSearch isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Global Search')).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/search books, users, groups, or posts/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Atomic' } });
    expect(input).toHaveValue('Atomic');
  });
});
