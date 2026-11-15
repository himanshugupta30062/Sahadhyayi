import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BookDescription from '@/components/books/BookDescription';

describe('BookDescription', () => {
  afterEach(() => cleanup());

  it('renders description and triggers onViewSummary', () => {
    const onViewSummary = vi.fn();
    render(
      <BookDescription
        description="A fascinating tale of exploration."
        onViewSummary={onViewSummary}
      />
    );

    expect(screen.getByText('About the Book')).toBeInTheDocument();
    expect(screen.getByText('A fascinating tale of exploration.')).toBeInTheDocument();

    const infoBtn = screen.getByTitle('View detailed summary');
    fireEvent.click(infoBtn);
    expect(onViewSummary).toHaveBeenCalledTimes(1);
  });
});
