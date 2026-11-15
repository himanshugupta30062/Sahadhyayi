import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeeklyReadingSummary from './WeeklyReadingSummary';

describe('WeeklyReadingSummary', () => {
  it('renders weekly reading progress stats and bars', () => {
    render(<WeeklyReadingSummary userId="user-123" />);

    expect(screen.getByText("This Week's Progress")).toBeInTheDocument();
    expect(screen.getByText('Books Read')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('Reading Time')).toBeInTheDocument();
    expect(screen.getByText('8.5h/12h')).toBeInTheDocument();
  });
});
