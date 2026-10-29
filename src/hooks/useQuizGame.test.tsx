// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  invoke: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) },
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mocks.toastError(...args), success: (...args: unknown[]) => mocks.toastSuccess(...args) },
}));

import { useQuizGame } from './useQuizGame';

const question = (overrides: Record<string, unknown> = {}) => ({
  id: 'question-1',
  book_id: 'book-1',
  question: 'Which answer is correct?',
  options: ['A', 'B', 'C', 'D'],
  correct_answer: 1,
  difficulty: 'medium',
  points: 20,
  hint: 'Think carefully',
  ...overrides,
});
const session = {
  id: 'session-1', user_id: 'reader-1', book_id: 'book-1', status: 'in_progress',
  current_question: 0, score: 0, difficulty: 'medium', lifelines_used: [],
  started_at: '2026-01-01T00:00:00.000Z',
};

describe('useQuizGame', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.invoke.mockReset().mockResolvedValue({ data: { questions: [question(), question({ id: 'question-2' })] }, error: null });
    mocks.from.mockReset().mockImplementation(() => builder);
    mocks.insert.mockReset().mockReturnValue(builder);
    mocks.select.mockReset().mockReturnValue(builder);
    mocks.single.mockReset().mockResolvedValue({ data: session, error: null });
    mocks.update.mockReset().mockReturnValue(builder);
    mocks.eq.mockReset().mockResolvedValue({ data: session, error: null });
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('rejects game starts for signed-out users', async () => {
    mocks.user = null;
    const { result } = renderHook(() => useQuizGame());

    let started;
    await act(async () => { started = await result.current.startGame('book-1'); });

    expect(started).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith('Please sign in to play');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it('handles empty generated question sets and clears loading state', async () => {
    mocks.invoke.mockResolvedValue({ data: { questions: [] }, error: null });
    const { result } = renderHook(() => useQuizGame());

    let started;
    await act(async () => { started = await result.current.startGame('book-1'); });

    expect(started).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.gameStatus).toBe('idle');
    expect(mocks.toastError).toHaveBeenCalledWith('Could not generate questions for this book');
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('requests fifteen questions for speed mode and initializes a session', async () => {
    const { result } = renderHook(() => useQuizGame());

    let started;
    await act(async () => { started = await result.current.startGame('book-1', 'hard', 'speed'); });

    expect(started).toBe(true);
    expect(mocks.invoke).toHaveBeenCalledWith('generate-quiz-questions', {
      body: { bookId: 'book-1', difficulty: 'hard', count: 15 },
    });
    expect(mocks.from).toHaveBeenCalledWith('game_sessions');
    expect(result.current.mode).toBe('speed');
    expect(result.current.currentQuestion).toEqual(question());
    expect(result.current.totalQuestions).toBe(2);
    expect(result.current.gameStatus).toBe('playing');
    expect(result.current.lives).toBe(3);
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Game started! Good luck! 🎮');
  });

  it('handles generation and session-creation failures without leaving loading active', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('generation failed') });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useQuizGame());

    let started;
    await act(async () => { started = await result.current.startGame('book-1'); });

    expect(started).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to start game');
  });

  it('awards doubled speed points for a correct answer and advances the session', async () => {
    const { result } = renderHook(() => useQuizGame());
    await act(async () => { await result.current.startGame('book-1', 'medium', 'speed'); });

    let answer;
    await act(async () => { answer = await result.current.answerQuestion(1); });

    expect(answer).toEqual({ isCorrect: true, pointsEarned: 40, finished: false });
    expect(result.current.score).toBe(40);
    expect(result.current.correctAnswers).toBe(1);
    expect(result.current.currentQuestionIndex).toBe(1);
    expect(mocks.from).toHaveBeenCalledWith('game_answers');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ score: 40, current_question: 1 }));
  });

  it('ends the session on the last question and returns the finished result', async () => {
    const { result } = renderHook(() => useQuizGame());
    await act(async () => { await result.current.startGame('book-1'); });
    await act(async () => { await result.current.answerQuestion(0); });

    let answer;
    await act(async () => { answer = await result.current.answerQuestion(1); });

    expect(answer).toEqual({ isCorrect: true, pointsEarned: 20, finished: true });
    expect(result.current.gameStatus).toBe('finished');
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'completed', score: 20, current_question: 2 }));
  });

  it('loses a life after a wrong survival answer and ends after the final life', async () => {
    mocks.invoke.mockResolvedValue({ data: { questions: [question(), question({ id: 'question-2' }), question({ id: 'question-3' }), question({ id: 'question-4' })] }, error: null });
    const { result } = renderHook(() => useQuizGame());
    await act(async () => { await result.current.startGame('book-1', 'medium', 'survival'); });

    await act(async () => { await result.current.answerQuestion(0); });
    expect(result.current.lives).toBe(2);
    await act(async () => { await result.current.answerQuestion(0); });
    expect(result.current.lives).toBe(1);
    let answer;
    await act(async () => { answer = await result.current.answerQuestion(0); });

    expect(answer).toEqual({ isCorrect: false, pointsEarned: 0, finished: true });
    expect(result.current.lives).toBe(0);
    expect(result.current.gameStatus).toBe('finished');
  });

  it('supports hints and rejects reusing the same lifeline', async () => {
    const { result } = renderHook(() => useQuizGame());
    await act(async () => { await result.current.startGame('book-1'); });

    let first;
    act(() => { first = result.current.useLifeline('hint'); });
    expect(first).toBe(true);
    expect(result.current.showHint).toBe(true);
    let second;
    act(() => { second = result.current.useLifeline('hint'); });
    expect(second).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith('You already used this lifeline!');
  });

  it('hides two wrong answers with 50-50 and resets all game state', async () => {
    const { result } = renderHook(() => useQuizGame());
    await act(async () => { await result.current.startGame('book-1'); });

    act(() => { result.current.useLifeline('50-50'); });
    expect(result.current.hiddenOptions).toHaveLength(2);
    expect(result.current.hiddenOptions).not.toContain(1);

    act(() => { result.current.resetGame(); });
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.totalQuestions).toBe(0);
    expect(result.current.score).toBe(0);
    expect(result.current.correctAnswers).toBe(0);
    expect(result.current.session).toBeNull();
    expect(result.current.gameStatus).toBe('idle');
    expect(result.current.mode).toBe('classic');
    expect(result.current.lives).toBe(3);
  });
});

const builder = {
  insert: (...args: unknown[]) => mocks.insert(...args),
  select: (...args: unknown[]) => mocks.select(...args),
  single: (...args: unknown[]) => mocks.single(...args),
  update: (...args: unknown[]) => mocks.update(...args),
  eq: (...args: unknown[]) => mocks.eq(...args),
  then: (resolve: (value: unknown) => unknown) => resolve({ data: null, error: null }),
};
