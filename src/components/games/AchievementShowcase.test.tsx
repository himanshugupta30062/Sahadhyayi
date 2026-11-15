import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import AchievementShowcase from '@/components/games/AchievementShowcase';

describe('AchievementShowcase', () => {
  afterEach(() => cleanup());

  const mockBadges = [
    {
      id: 'b1',
      name: 'Novice Reader',
      description: 'Play 5 games',
      icon: '🎮',
      requirement_type: 'games_played',
      requirement_value: 5,
    },
    {
      id: 'b2',
      name: 'High Scorer',
      description: 'Earn 1000 points',
      icon: '⭐',
      requirement_type: 'total_points',
      requirement_value: 1000,
    },
  ];

  const mockUserBadges = [
    {
      id: 'ub1',
      user_id: 'u1',
      badge_id: 'b1',
      earned_at: '2026-01-01T00:00:00Z',
    },
  ];

  it('renders achievements, badge count, and earned badges', () => {
    render(
      <AchievementShowcase
        allBadges={mockBadges as any}
        userBadges={mockUserBadges as any}
        totalPoints={500}
        gamesPlayed={10}
      />
    );

    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getAllByText('Novice Reader').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('High Scorer').length).toBeGreaterThanOrEqual(1);
  });
});
