import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReadingStats from './ReadingStats';

vi.mock('@/hooks/useBookStats', () => ({
  useBookStats: () => ({
    data: {
      currentReaders: 85,
      pastReaders: 320,
      readers: [
        { id: 'u-1', name: 'Alice', avatar: '', status: 'completed' },
      ],
    },
    isLoading: false,
  }),
}));

describe('ReadingStats', () => {
  it('renders reading stats and community metrics', () => {
    render(
      <MemoryRouter>
        <ReadingStats bookId="book-1" bookTitle="Clean Code" />
      </MemoryRouter>
    );

    expect(screen.getByText('Reading Community')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('Currently Reading')).toBeInTheDocument();
    expect(screen.getByText('Have Read')).toBeInTheDocument();
  });
});
