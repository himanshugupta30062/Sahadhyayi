// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  authLoading: false,
  stats: { total_points: 240, games_played: 4, games_won: 2, best_streak: 3, current_streak: 3 },
  statsLoading: false,
  startGame: vi.fn(),
  answerQuestion: vi.fn(),
  addPoints: vi.fn(),
  checkAndAwardBadges: vi.fn(),
  resetGame: vi.fn(),
  refetchStats: vi.fn(),
  dismissNewBadge: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.authLoading }),
}));
vi.mock('@/hooks/useGameStats', () => ({
  useGameStats: () => ({
    stats: mocks.stats,
    loading: mocks.statsLoading,
    addPoints: mocks.addPoints,
    refetch: mocks.refetchStats,
  }),
  getRankForPoints: (points: number) => points >= 200
    ? { name: 'Reader', icon: '📕' }
    : { name: 'Beginner', icon: '📖' },
  getNextRank: (points: number) => points >= 500 ? null : { name: 'Scholar', minPoints: 500 },
}));
vi.mock('@/hooks/useQuizGame', () => ({
  useQuizGame: () => ({
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions: 10,
    score: 0,
    correctAnswers: 0,
    lifelinesUsed: [],
    loading: false,
    hiddenOptions: [],
    showHint: false,
    mode: 'classic',
    lives: 3,
    startGame: mocks.startGame,
    answerQuestion: mocks.answerQuestion,
    useLifeline: vi.fn(),
    resetGame: mocks.resetGame,
  }),
}));
vi.mock('@/hooks/useGameBadges', () => ({
  useGameBadges: () => ({
    allBadges: [],
    userBadges: [],
    checkAndAwardBadges: mocks.checkAndAwardBadges,
    newBadge: null,
    dismissNewBadge: mocks.dismissNewBadge,
  }),
}));
vi.mock('@/components/SEO', () => ({ default: () => null }));
vi.mock('@/components/games/Leaderboard', () => ({ default: () => <div>Leaderboard mock</div> }));
vi.mock('@/components/games/AchievementShowcase', () => ({ default: () => <div>Achievement showcase mock</div> }));
vi.mock('@/components/games/FriendChallenge', () => ({ default: () => <div>Friend challenge mock</div> }));
vi.mock('@/components/games/StreakBonus', () => ({ default: ({ streak }: { streak: number }) => <div>Streak {streak}</div> }));
vi.mock('@/components/games/GameModeSelector', () => ({
  default: () => <div>Game mode selector mock</div>,
  DailyChallenges: () => <div>Daily challenges mock</div>,
}));
vi.mock('@/components/games/BookSelector', () => ({ default: () => <div>Book selector mock</div> }));
vi.mock('@/components/games/QuizGame', () => ({ default: () => <div>Quiz game mock</div> }));
vi.mock('@/components/games/GameResults', () => ({ default: () => <div>Game results mock</div> }));

import Games from './Games';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="route">{location.pathname + location.search}</output>;
};

const renderGames = () => render(
  <MemoryRouter initialEntries={['/games']}>
    <Games />
    <LocationDisplay />
  </MemoryRouter>,
);

describe('Games page', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.authLoading = false;
    mocks.stats = { total_points: 240, games_played: 4, games_won: 2, best_streak: 3, current_streak: 3 };
    mocks.statsLoading = false;
    mocks.startGame.mockReset().mockResolvedValue(true);
    mocks.answerQuestion.mockReset();
    mocks.addPoints.mockReset().mockResolvedValue(undefined);
    mocks.checkAndAwardBadges.mockReset().mockResolvedValue(undefined);
    mocks.resetGame.mockReset();
    mocks.refetchStats.mockReset();
    mocks.dismissNewBadge.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows an auth loading state before rendering the game entry point', () => {
    mocks.authLoading = true;
    renderGames();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sign In to Play/ })).not.toBeInTheDocument();
  });

  it('prompts signed-out visitors to sign in and preserves the games redirect', () => {
    renderGames();

    expect(screen.getByRole('heading', { name: 'Book Quiz Challenge' })).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Play/ }));
    expect(screen.getByLabelText('route')).toHaveTextContent('/signin?redirect=%2Fgames');
  });

  it('renders signed-in stats, rank progress, streak and the main game tabs', () => {
    mocks.user = { id: 'reader-1' };
    renderGames();

    expect(screen.getByRole('heading', { name: /Book Quiz/ })).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText('Reader')).toBeInTheDocument();
    expect(screen.getByText('Streak 3')).toBeInTheDocument();
    expect(screen.getByText('Daily challenges mock')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Social/ }));
    expect(screen.getByText('Friend challenge mock')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Achievements/ }));
    expect(screen.getByText('Achievement showcase mock')).toBeInTheDocument();
  });

  it('lets a signed-in reader change difficulty and enter book selection', async () => {
    mocks.user = { id: 'reader-1' };
    renderGames();

    fireEvent.click(screen.getByRole('button', { name: /hard/i }));
    expect(screen.getByRole('button', { name: /hard/i })).toHaveClass('bg-red-600');

    fireEvent.click(screen.getByRole('button', { name: /Start Quiz/ }));
    expect(await screen.findByText('Book selector mock')).toBeInTheDocument();
  });
});
