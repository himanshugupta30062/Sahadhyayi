import { describe, expect, it } from 'vitest';
import { matchesReadingGroupTopic, READING_GROUP_TOPICS } from './readingGroupTopics';

describe('reading group topic discovery', () => {
  it('exposes all reader-interest categories with an All fallback', () => {
    expect(READING_GROUP_TOPICS.map(({ id }) => id)).toEqual([
      'all', 'fiction', 'philosophy', 'science', 'history', 'poetry', 'growth',
    ]);
    expect(matchesReadingGroupTopic('all', 'Mystery Circle', '')).toBe(true);
  });

  it('matches topic terms case-insensitively across name and description', () => {
    expect(matchesReadingGroupTopic('fiction', 'The Novel Circle', null)).toBe(true);
    expect(matchesReadingGroupTopic('philosophy', 'Readers', 'Vedanta and ethics')).toBe(true);
    expect(matchesReadingGroupTopic('science', 'Curious Minds', 'Physics for everyone')).toBe(true);
    expect(matchesReadingGroupTopic('history', 'History lovers', '')).toBe(true);
    expect(matchesReadingGroupTopic('poetry', 'Urdu Ghazal Readers', '')).toBe(true);
    expect(matchesReadingGroupTopic('growth', 'Mindfulness Club', '')).toBe(true);
  });

  it('keeps unmatched and unknown categories discoverable under All', () => {
    expect(matchesReadingGroupTopic('fiction', 'Readers United', 'Books and friendship')).toBe(false);
    expect(matchesReadingGroupTopic('future-topic', 'Readers United', 'Books and friendship')).toBe(true);
  });
});
