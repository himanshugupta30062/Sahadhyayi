import { describe, expect, it } from 'vitest';
import {
  calculateAnnualGoalStatus,
  calculateMonthlyGoalStatus,
  calculateWeeklyTimeGoalStatus,
} from './readingGoalsEngine';

describe('readingGoalsEngine', () => {
  it('calculates annual goal completion and required pace', () => {
    // 6 books completed out of 12, reference date mid-year (June)
    const midYear = new Date(2026, 5, 15);
    const result = calculateAnnualGoalStatus(6, 12, 250, midYear);

    expect(result.target).toBe(12);
    expect(result.completed).toBe(6);
    expect(result.percent).toBe(50);
    expect(result.isCompleted).toBe(false);
    expect(result.remaining).toBe(6);
    expect(result.requiredBooksPerMonth).toBeGreaterThan(0);
    expect(result.status).toBe('on_track');
  });

  it('identifies completed annual goal', () => {
    const result = calculateAnnualGoalStatus(15, 12);
    expect(result.isCompleted).toBe(true);
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.status).toBe('completed');
  });

  it('calculates monthly page goal remaining and daily pace', () => {
    const referenceDate = new Date(2026, 10, 10); // Nov 10
    const result = calculateMonthlyGoalStatus(100, 300, referenceDate);

    expect(result.target).toBe(300);
    expect(result.currentPages).toBe(100);
    expect(result.percent).toBe(33);
    expect(result.remainingPages).toBe(200);
    expect(result.requiredPagesPerDay).toBeGreaterThan(0);
    expect(result.isCompleted).toBe(false);
  });

  it('calculates weekly minutes goal status', () => {
    const result = calculateWeeklyTimeGoalStatus(150, 120);
    expect(result.percent).toBe(100);
    expect(result.isCompleted).toBe(true);
    expect(result.remainingMinutes).toBe(0);
  });
});
