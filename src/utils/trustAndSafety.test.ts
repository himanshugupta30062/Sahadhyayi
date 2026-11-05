import { describe, expect, it } from 'vitest';
import { containsInappropriateLanguage, bannedWords } from './trustAndSafety';

describe('trustAndSafety', () => {
  it('exports bannedWords array', () => {
    expect(Array.isArray(bannedWords)).toBe(true);
    expect(bannedWords.length).toBeGreaterThan(10);
  });

  it('detects banned words with length > 4', () => {
    expect(containsInappropriateLanguage('Check out this free money offer!')).toBe(true);
    expect(containsInappropriateLanguage('You should buy now to save big')).toBe(true);
  });

  it('detects short banned words using word boundaries to avoid false positives', () => {
    expect(containsInappropriateLanguage('This is unacceptable: kys')).toBe(true);
    expect(containsInappropriateLanguage('What a complete and total fag')).toBe(true);
    // Non-slur word containing substring should not falsely trigger if isolated by word boundary
    expect(containsInappropriateLanguage('The sky is bright and sunny')).toBe(false);
  });

  it('returns false for clean, constructive reader discussions', () => {
    expect(containsInappropriateLanguage('I loved reading War and Peace by Leo Tolstoy.')).toBe(false);
    expect(containsInappropriateLanguage('The character development in chapter 4 was brilliant.')).toBe(false);
  });
});

