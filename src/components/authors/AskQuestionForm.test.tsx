import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AskQuestionForm } from './AskQuestionForm';

let mockUser: { id: string } | null = { id: 'reader-1' };
const mockMutate = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/hooks/useAuthorQuestions', () => ({
  useAskQuestion: () => ({ mutate: mockMutate, isPending: false }),
}));

describe('AskQuestionForm', () => {
  it('shows sign in prompt when unauthenticated', () => {
    mockUser = null;
    render(<AskQuestionForm authorId="auth-1" authorName="Ruskin Bond" />);
    expect(screen.getByText(/please sign in to ask questions/i)).toBeInTheDocument();
    mockUser = { id: 'reader-1' };
  });

  it('renders question form and submits question', () => {
    render(<AskQuestionForm authorId="auth-1" authorName="Ruskin Bond" />);

    expect(screen.getByText(/ask ruskin bond a question/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/what would you like to ask the author\?/i);
    fireEvent.change(textarea, { target: { value: 'What inspired The Blue Umbrella?' } });

    const submitBtn = screen.getByRole('button', { name: /ask question/i });
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith({
      authorId: 'auth-1',
      question: 'What inspired The Blue Umbrella?',
    });
  });
});
