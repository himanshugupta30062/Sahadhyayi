import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SortingInfoTooltip from './SortingInfoTooltip';

describe('SortingInfoTooltip', () => {
  it('renders sorting info trigger button with accessible label', () => {
    render(<SortingInfoTooltip />);
    const button = screen.getByRole('button', { name: /how books are sorted/i });
    expect(button).toBeInTheDocument();
  });
});
