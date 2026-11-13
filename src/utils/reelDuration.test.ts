import { describe, it, expect } from 'vitest';
import { formatReelDuration, formatReelTime } from './reelDuration';

describe('formatReelDuration', () => {
  it('formats whole seconds as integers with "s"', () => {
    expect(formatReelDuration(10)).toBe('10s');
    expect(formatReelDuration(5)).toBe('5s');
    expect(formatReelDuration(1)).toBe('1s');
  });

  it('formats fractional seconds with one decimal place', () => {
    expect(formatReelDuration(7.5)).toBe('7.5s');
    expect(formatReelDuration(9.25)).toBe('9.3s');
    expect(formatReelDuration(3.41)).toBe('3.4s');
  });

  it('returns null for missing, zero, negative, or invalid durations', () => {
    expect(formatReelDuration(null)).toBeNull();
    expect(formatReelDuration(undefined)).toBeNull();
    expect(formatReelDuration(0)).toBeNull();
    expect(formatReelDuration(-5)).toBeNull();
    expect(formatReelDuration(NaN)).toBeNull();
  });
});

describe('formatReelTime', () => {
  it('formats seconds into mm:ss notation', () => {
    expect(formatReelTime(0)).toBe('00:00');
    expect(formatReelTime(4)).toBe('00:04');
    expect(formatReelTime(10)).toBe('00:10');
    expect(formatReelTime(59)).toBe('00:59');
    expect(formatReelTime(65)).toBe('01:05');
  });

  it('handles negative or invalid seconds gracefully', () => {
    expect(formatReelTime(-1)).toBe('00:00');
    expect(formatReelTime(NaN)).toBe('00:00');
  });
});
