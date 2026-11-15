import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageSummarySection from './PageSummarySection';

vi.mock('./EnhancedBookSummarySection', () => ({
  default: ({ bookTitle }: { bookTitle: string }) => (
    <div data-testid="enhanced-summary">Summary for {bookTitle}</div>
  ),
}));

describe('PageSummarySection', () => {
  it('renders EnhancedBookSummarySection with props', () => {
    render(<PageSummarySection bookId="book-1" bookTitle="1984" />);
    expect(screen.getByText('Summary for 1984')).toBeInTheDocument();
  });
});
