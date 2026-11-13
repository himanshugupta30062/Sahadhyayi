import { describe, expect, it } from 'vitest';
import { evaluateReadingAchievements } from './readingAchievements';

describe('readingAchievements', () => {
  it('unlocks badges when thresholds are met and identifies next milestone', () => {
    const input = {
      completedBooksCount: 5,
      totalLoggedPages: 1200,
      bestStreakDays: 8,
      currentStreakDays: 7,
      uniqueGenresCount: 4,
      ratedBooksCount: 6,
    };

    const summary = evaluateReadingAchievements(input);

    expect(summary.totalCount).toBeGreaterThan(10);
    expect(summary.unlockedCount).toBeGreaterThan(0);
    expect(summary.percentUnlocked).toBeGreaterThan(0);

    const firstChapter = summary.achievements.find((a) => a.id === 'books-1');
    expect(firstChapter?.unlocked).toBe(true);

    const avidReader = summary.achievements.find((a) => a.id === 'books-5');
    expect(avidReader?.unlocked).toBe(true);

    const bookworm = summary.achievements.find((a) => a.id === 'books-10');
    expect(bookworm?.unlocked).toBe(false);
    expect(bookworm?.progressPercent).toBe(50); // 5/10

    // Next milestone should be defined
    expect(summary.nextMilestone).not.toBeNull();
  });

  it('handles brand new reader with 0 stats', () => {
    const summary = evaluateReadingAchievements({
      completedBooksCount: 0,
      totalLoggedPages: 0,
      bestStreakDays: 0,
      currentStreakDays: 0,
      uniqueGenresCount: 0,
      ratedBooksCount: 0,
    });

    expect(summary.unlockedCount).toBe(0);
    expect(summary.percentUnlocked).toBe(0);
    expect(summary.nextMilestone?.id).toBe('books-1');
  });
});
