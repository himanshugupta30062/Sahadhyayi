export type AchievementCategory = 'books' | 'pages' | 'streak' | 'genre' | 'reviews';

export interface ReadingAchievement {
  id: string;
  name: string;
  category: AchievementCategory;
  description: string;
  emoji: string;
  targetValue: number;
  currentValue: number;
  unlocked: boolean;
  progressPercent: number;
}

export interface AchievementEvaluationInput {
  completedBooksCount: number;
  totalLoggedPages: number;
  bestStreakDays: number;
  currentStreakDays: number;
  uniqueGenresCount: number;
  ratedBooksCount: number;
}

export interface AchievementSummary {
  unlockedCount: number;
  totalCount: number;
  percentUnlocked: number;
  achievements: ReadingAchievement[];
  nextMilestone: ReadingAchievement | null;
}

const ACHIEVEMENT_DEFINITIONS: Array<{
  id: string;
  name: string;
  category: AchievementCategory;
  description: string;
  emoji: string;
  targetValue: number;
  getValue: (input: AchievementEvaluationInput) => number;
}> = [
  // Books completed
  {
    id: 'books-1',
    name: 'First Chapter',
    category: 'books',
    description: 'Finish your first complete book on Sahadhyayi',
    emoji: '🌱',
    targetValue: 1,
    getValue: (i) => i.completedBooksCount,
  },
  {
    id: 'books-5',
    name: 'Avid Reader',
    category: 'books',
    description: 'Complete 5 books across your bookshelf',
    emoji: '📚',
    targetValue: 5,
    getValue: (i) => i.completedBooksCount,
  },
  {
    id: 'books-10',
    name: 'Dedicated Bookworm',
    category: 'books',
    description: 'Reach 10 completed books',
    emoji: '🔥',
    targetValue: 10,
    getValue: (i) => i.completedBooksCount,
  },
  {
    id: 'books-25',
    name: 'Shelf Legend',
    category: 'books',
    description: 'Conquer a milestone of 25 completed books',
    emoji: '🏆',
    targetValue: 25,
    getValue: (i) => i.completedBooksCount,
  },
  {
    id: 'books-50',
    name: 'Century Master',
    category: 'books',
    description: 'Read and complete 50 books',
    emoji: '👑',
    targetValue: 50,
    getValue: (i) => i.completedBooksCount,
  },

  // Pages read
  {
    id: 'pages-500',
    name: 'Novice Scroller',
    category: 'pages',
    description: 'Log your first 500 pages of focused reading',
    emoji: '📖',
    targetValue: 500,
    getValue: (i) => i.totalLoggedPages,
  },
  {
    id: 'pages-1000',
    name: 'Page Turner',
    category: 'pages',
    description: 'Log 1,000 total reading pages',
    emoji: '✨',
    targetValue: 1000,
    getValue: (i) => i.totalLoggedPages,
  },
  {
    id: 'pages-5000',
    name: 'Volume Conqueror',
    category: 'pages',
    description: 'Surpass 5,000 logged pages',
    emoji: '⚡',
    targetValue: 5000,
    getValue: (i) => i.totalLoggedPages,
  },
  {
    id: 'pages-10000',
    name: 'Literary Voyager',
    category: 'pages',
    description: 'Cross the milestone of 10,000 pages read',
    emoji: '🚀',
    targetValue: 10000,
    getValue: (i) => i.totalLoggedPages,
  },

  // Reading streaks
  {
    id: 'streak-3',
    name: 'Reading Spark',
    category: 'streak',
    description: 'Build a 3-day consecutive reading habit',
    emoji: '🕯️',
    targetValue: 3,
    getValue: (i) => Math.max(i.currentStreakDays, i.bestStreakDays),
  },
  {
    id: 'streak-7',
    name: 'Weekly Rhythm',
    category: 'streak',
    description: 'Maintain a 7-day uninterrupted reading streak',
    emoji: '🌟',
    targetValue: 7,
    getValue: (i) => Math.max(i.currentStreakDays, i.bestStreakDays),
  },
  {
    id: 'streak-14',
    name: 'Two-Week Orbit',
    category: 'streak',
    description: 'Reach a 14-day daily reading streak',
    emoji: '🪐',
    targetValue: 14,
    getValue: (i) => Math.max(i.currentStreakDays, i.bestStreakDays),
  },
  {
    id: 'streak-30',
    name: 'Unstoppable Momentum',
    category: 'streak',
    description: 'Log reading every day for 30 consecutive days',
    emoji: '💎',
    targetValue: 30,
    getValue: (i) => Math.max(i.currentStreakDays, i.bestStreakDays),
  },

  // Genres
  {
    id: 'genre-3',
    name: 'Genre Explorer',
    category: 'genre',
    description: 'Finish books spanning at least 3 distinct genres',
    emoji: '🌈',
    targetValue: 3,
    getValue: (i) => i.uniqueGenresCount,
  },
  {
    id: 'genre-5',
    name: 'Eclectic Scholar',
    category: 'genre',
    description: 'Explore books across 5 or more diverse genres',
    emoji: '🎨',
    targetValue: 5,
    getValue: (i) => i.uniqueGenresCount,
  },

  // Ratings & Reviews
  {
    id: 'review-5',
    name: 'Thoughtful Reviewer',
    category: 'reviews',
    description: 'Rate and evaluate at least 5 completed books',
    emoji: '⭐',
    targetValue: 5,
    getValue: (i) => i.ratedBooksCount,
  },
  {
    id: 'review-20',
    name: 'Literary Critic',
    category: 'reviews',
    description: 'Rate and reflect on 20 completed reads',
    emoji: '📝',
    targetValue: 20,
    getValue: (i) => i.ratedBooksCount,
  },
];

export function evaluateReadingAchievements(
  input: AchievementEvaluationInput
): AchievementSummary {
  const evaluated: ReadingAchievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const rawVal = def.getValue(input);
    const currentValue = Math.max(0, rawVal);
    const unlocked = currentValue >= def.targetValue;
    const progressPercent = Math.min(
      100,
      Math.round((currentValue / def.targetValue) * 100)
    );

    return {
      id: def.id,
      name: def.name,
      category: def.category,
      description: def.description,
      emoji: def.emoji,
      targetValue: def.targetValue,
      currentValue,
      unlocked,
      progressPercent,
    };
  });

  const unlockedCount = evaluated.filter((a) => a.unlocked).length;
  const totalCount = evaluated.length;
  const percentUnlocked =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Closest locked milestone by progressPercent
  const locked = evaluated.filter((a) => !a.unlocked);
  const nextMilestone =
    locked.length > 0
      ? [...locked].sort((a, b) => b.progressPercent - a.progressPercent)[0]
      : null;

  return {
    unlockedCount,
    totalCount,
    percentUnlocked,
    achievements: evaluated,
    nextMilestone,
  };
}
