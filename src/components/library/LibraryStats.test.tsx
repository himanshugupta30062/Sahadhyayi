import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import LibraryStats from './LibraryStats';

describe('LibraryStats', () => {
  it('renders default reading stats and metrics', () => {
    render(<LibraryStats />);

    expect(screen.getByRole('heading', { name: /Reading Goal/i })).toBeInTheDocument();
    expect(screen.getByText('Books Read')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('Reading Streak')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Reading Time')).toBeInTheDocument();
    expect(screen.getByText('156h')).toBeInTheDocument();

    expect(screen.getByText('Bibliophile')).toBeInTheDocument();
    expect(screen.getByText('Critic')).toBeInTheDocument();
    expect(screen.getByText('Social Reader')).toBeInTheDocument();
    expect(screen.getByText('Goal Crusher')).toBeInTheDocument();
  });

  it('renders customized metrics when passed as props', () => {
    render(
      <LibraryStats
        booksRead={25}
        readingGoal={50}
        streak={18}
        totalReadingTime={80}
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('80h')).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });
});
