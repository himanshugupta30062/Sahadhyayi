import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingGoalTracker from './ReadingGoalTracker';

describe('ReadingGoalTracker', () => {
  it('allows incrementing, decrementing, and updating goal', () => {
    render(<ReadingGoalTracker initialGoal={5} />);

    expect(screen.getByText('Reading Goal')).toBeInTheDocument();
    expect(screen.getByText(/books read: 0 \/ 5/i)).toBeInTheDocument();

    const plusBtn = screen.getByRole('button', { name: '+1' });
    const minusBtn = screen.getByRole('button', { name: '-1' });

    expect(minusBtn).toBeDisabled();

    fireEvent.click(plusBtn);
    expect(screen.getByText(/books read: 1 \/ 5/i)).toBeInTheDocument();
    expect(minusBtn).not.toBeDisabled();

    fireEvent.click(minusBtn);
    expect(screen.getByText(/books read: 0 \/ 5/i)).toBeInTheDocument();

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '10' } });
    expect(screen.getByText(/books read: 0 \/ 10/i)).toBeInTheDocument();
  });
});
