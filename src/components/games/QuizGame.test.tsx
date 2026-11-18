import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import confetti from 'canvas-confetti';
import type { QuizQuestion } from '@/hooks/useQuizGame';
import QuizGame from './QuizGame';

vi.mock('framer-motion', async () => {
  const ReactModule = await import('react');
  const createMotionElement = (tag: string) =>
    ReactModule.forwardRef<any, any>((props, ref) => {
      const {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        ...domProps
      } = props;
      return ReactModule.createElement(tag, { ...domProps, ref }, props.children);
    });

  return {
    motion: {
      div: createMotionElement('div'),
      button: createMotionElement('button'),
    },
    AnimatePresence: ({ children }: any) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

vi.mock('canvas-confetti', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

const baseQuestion: QuizQuestion = {
  id: 'question-1',
  book_id: 'book-1',
  question: 'Which option is correct?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correct_answer: 1,
  difficulty: 'medium',
  points: 20,
  hint: 'Read each option carefully.',
  explanation: 'The second option is supported by the text.',
};

type Props = React.ComponentProps<typeof QuizGame>;

const createProps = (overrides: Partial<Props> = {}): Props => ({
  question: baseQuestion,
  questionNumber: 2,
  totalQuestions: 10,
  score: 1250,
  lifelinesUsed: [],
  hiddenOptions: [],
  showHint: false,
  onAnswer: vi.fn(),
  onUseLifeline: vi.fn().mockReturnValue(true),
  onQuit: vi.fn(),
  streak: 0,
  mode: 'classic',
  lives: 3,
  ...overrides,
});

const renderGame = (overrides: Partial<Props> = {}) => {
  const props = createProps(overrides);
  return { ...render(<QuizGame {...props} />), props };
};

describe('QuizGame', () => {
  beforeEach(() => {
    vi.mocked(confetti).mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the question, progress, timer, hint and score', () => {
    renderGame({ showHint: true });

    expect(screen.getByText('Which option is correct?')).toBeInTheDocument();
    expect(screen.getByText('Question 2/10')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('Read each option carefully.')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('20 pts')).toBeInTheDocument();
  });

  it('disables hidden answers and lifelines that have already been used', () => {
    renderGame({ hiddenOptions: [0, 2], lifelinesUsed: ['skip'] });

    expect(screen.getByText('Option A').closest('button')).toBeDisabled();
    expect(screen.getByText('Option C').closest('button')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hint' })).toBeEnabled();
  });

  it('awards normal points for a correct answer and advances after two seconds', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    renderGame({ onAnswer });

    fireEvent.click(screen.getByText('Option B'));

    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('Option B').closest('button')).toBeDisabled();
    expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    }));

    act(() => { vi.advanceTimersByTime(1999); });
    expect(onAnswer).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it('doubles speed-mode points and shows the streak milestone popup', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    renderGame({ mode: 'speed', streak: 2, onAnswer });

    expect(screen.getByText('15s')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Option B'));

    expect(screen.getByText('+40')).toBeInTheDocument();
    expect(screen.getByText('3 in a row!')).toBeInTheDocument();
    expect(screen.getByText('Great!')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it('shows the correct answer and explanation after a wrong answer', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    renderGame({ onAnswer });

    fireEvent.click(screen.getByText('Option A'));

    expect(screen.getByText('Correct Answer: B')).toBeInTheDocument();
    expect(screen.getByText('The second option is supported by the text.')).toBeInTheDocument();
    expect(screen.queryByText('+20')).not.toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(onAnswer).toHaveBeenCalledWith(0);
  });

  it('submits -1 when the countdown expires', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    renderGame({ onAnswer });

    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByText('0s')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1499); });
    expect(onAnswer).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });

    expect(screen.getByText('Correct Answer: B')).toBeInTheDocument();
    expect(onAnswer).toHaveBeenCalledWith(-1);
  });

  it('hides the countdown in survival mode and announces the remaining lives', () => {
    renderGame({ mode: 'survival', lives: 2 });

    expect(screen.getByLabelText('2 lives remaining')).toBeInTheDocument();
    expect(screen.queryByText('30s')).not.toBeInTheDocument();
  });

  it('forwards quit and lifeline actions to the parent', () => {
    const onQuit = vi.fn();
    const onUseLifeline = vi.fn().mockReturnValue(true);
    renderGame({ onQuit, onUseLifeline });

    fireEvent.click(screen.getByRole('button', { name: 'Quit' }));
    fireEvent.click(screen.getByRole('button', { name: '50:50' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));

    expect(onQuit).toHaveBeenCalledOnce();
    expect(onUseLifeline).toHaveBeenNthCalledWith(1, '50-50');
    expect(onUseLifeline).toHaveBeenNthCalledWith(2, 'hint');
  });

  it('resets the selected answer and result when the question number changes', () => {
    vi.useFakeTimers();
    const firstProps = createProps();
    const { rerender } = render(<QuizGame {...firstProps} />);

    fireEvent.click(screen.getByText('Option A'));
    expect(screen.getByText('Correct Answer: B')).toBeInTheDocument();

    const nextProps = createProps({
      questionNumber: 3,
      question: { ...baseQuestion, id: 'question-2', question: 'What comes next?' },
    });
    rerender(<QuizGame {...nextProps} />);

    expect(screen.getByText('What comes next?')).toBeInTheDocument();
    expect(screen.queryByText('Correct Answer: B')).not.toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('Option A').closest('button')).toBeEnabled();
  });

  it('cancels pending answer advancement when unmounted', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    const { unmount } = renderGame({ onAnswer });

    fireEvent.click(screen.getByText('Option B'));
    unmount();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
