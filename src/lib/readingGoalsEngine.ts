export interface AnnualGoalStatus {
  target: number;
  completed: number;
  percent: number;
  isCompleted: number | boolean;
  remaining: number;
  requiredBooksPerMonth: number;
  requiredPagesPerDayApprox: number;
  status: 'ahead' | 'on_track' | 'behind' | 'completed';
}

export interface MonthlyGoalStatus {
  target: number;
  currentPages: number;
  percent: number;
  isCompleted: boolean;
  remainingPages: number;
  requiredPagesPerDay: number;
}

export interface WeeklyTimeGoalStatus {
  targetMinutes: number;
  currentMinutes: number;
  percent: number;
  isCompleted: boolean;
  remainingMinutes: number;
}

export function calculateAnnualGoalStatus(
  completedBooks: number,
  targetBooks: number,
  avgPagesPerBook = 250,
  referenceDate = new Date()
): AnnualGoalStatus {
  const safeTarget = Math.max(1, targetBooks);
  const safeCompleted = Math.max(0, completedBooks);
  const percent = Math.min(100, Math.round((safeCompleted / safeTarget) * 100));
  const isCompleted = safeCompleted >= safeTarget;
  const remaining = Math.max(0, safeTarget - safeCompleted);

  const monthIndex = referenceDate.getMonth(); // 0-11
  const monthsRemaining = Math.max(1, 12 - monthIndex);
  const requiredBooksPerMonth = Number((remaining / monthsRemaining).toFixed(1));

  // Days left in the year
  const endOfYear = new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59);
  const msRemaining = Math.max(1, endOfYear.getTime() - referenceDate.getTime());
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const totalRemainingPages = remaining * avgPagesPerBook;
  const requiredPagesPerDayApprox = Math.ceil(totalRemainingPages / daysRemaining);

  // Expected progress benchmark based on day of the year
  const dayOfYear = Math.floor(
    (referenceDate.getTime() - new Date(referenceDate.getFullYear(), 0, 1).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;
  const expectedFraction = Math.min(1, dayOfYear / 365);
  const expectedBooksAtThisPoint = safeTarget * expectedFraction;

  let status: 'ahead' | 'on_track' | 'behind' | 'completed' = 'on_track';
  if (isCompleted) {
    status = 'completed';
  } else if (safeCompleted >= expectedBooksAtThisPoint + 1) {
    status = 'ahead';
  } else if (safeCompleted < expectedBooksAtThisPoint - 1.5) {
    status = 'behind';
  }

  return {
    target: safeTarget,
    completed: safeCompleted,
    percent,
    isCompleted,
    remaining,
    requiredBooksPerMonth,
    requiredPagesPerDayApprox,
    status,
  };
}

export function calculateMonthlyGoalStatus(
  currentPages: number,
  targetPages: number,
  referenceDate = new Date()
): MonthlyGoalStatus {
  const safeTarget = Math.max(1, targetPages);
  const safeCurrent = Math.max(0, currentPages);
  const percent = Math.min(100, Math.round((safeCurrent / safeTarget) * 100));
  const isCompleted = safeCurrent >= safeTarget;
  const remainingPages = Math.max(0, safeTarget - safeCurrent);

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = referenceDate.getDate();
  const daysRemainingInMonth = Math.max(1, daysInMonth - dayOfMonth + 1);
  const requiredPagesPerDay = Math.ceil(remainingPages / daysRemainingInMonth);

  return {
    target: safeTarget,
    currentPages: safeCurrent,
    percent,
    isCompleted,
    remainingPages,
    requiredPagesPerDay,
  };
}

export function calculateWeeklyTimeGoalStatus(
  currentMinutes: number,
  targetMinutes: number
): WeeklyTimeGoalStatus {
  const safeTarget = Math.max(1, targetMinutes);
  const safeCurrent = Math.max(0, currentMinutes);
  const percent = Math.min(100, Math.round((safeCurrent / safeTarget) * 100));
  const isCompleted = safeCurrent >= safeTarget;
  const remainingMinutes = Math.max(0, safeTarget - safeCurrent);

  return {
    targetMinutes: safeTarget,
    currentMinutes: safeCurrent,
    percent,
    isCompleted,
    remainingMinutes,
  };
}
