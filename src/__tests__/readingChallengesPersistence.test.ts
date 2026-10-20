import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20261020190000_persist_reading_challenges_and_badges.sql',
    import.meta.url,
  ),
  'utf8',
);
const challengeHook = readFileSync(
  new URL('../../src/hooks/useReadingChallenges.ts', import.meta.url),
  'utf8',
);
const distinctProgressFix = readFileSync(
  new URL(
    '../../supabase/migrations/20261020200000_count_distinct_completed_books.sql',
    import.meta.url,
  ),
  'utf8',
);
const bookshelfHook = readFileSync(
  new URL('../../src/hooks/useUserBookshelf.ts', import.meta.url),
  'utf8',
);

describe('persistent reading challenges and achievements', () => {
  it('creates challenge participation tables with per-user uniqueness', () => {
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.reading_challenges/i);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.user_challenges/i);
    expect(migration).toMatch(/UNIQUE \(user_id, challenge_id\)/i);
    expect(migration).toMatch(/CREATE POLICY "Users can join active reading challenges"[\s\S]*auth\.uid\(\)[\s\S]*rc\.is_active = true/i);
  });

  it('maintains progress from completed bookshelf entries and prevents client self-awards', () => {
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.sync_reading_challenge_progress/i);
    expect(migration).toMatch(/FROM public\.user_bookshelf[\s\S]*status = 'completed'/i);
    expect(migration).toMatch(/progress = LEAST\(v_completed_books, rc\.goal\)/i);
    expect(migration).toMatch(/CREATE TRIGGER sync_reading_challenges_from_bookshelf/i);
    expect(migration).toMatch(/CREATE TRIGGER initialize_reading_challenge_progress/i);
    expect(migration).toMatch(/REVOKE ALL PRIVILEGES ON TABLE public\.user_challenges FROM PUBLIC, anon, authenticated/i);
    expect(migration).toMatch(/GRANT SELECT, INSERT, DELETE ON TABLE public\.user_challenges TO authenticated/i);
    expect(migration).toMatch(/GRANT SELECT ON TABLE public\.user_reading_badges TO authenticated/i);
    expect(migration).toMatch(/ON CONFLICT \(user_id, badge_id\) DO NOTHING/i);
  });

  it('seeds real reading milestones and backfills only currently completed books', () => {
    expect(migration).toMatch(/'read-5-books'[\s\S]*'read-12-books'/i);
    expect(migration).toMatch(/'first-book-completed'[\s\S]*'five-books-completed'[\s\S]*'ten-books-completed'/i);
    expect(migration).toMatch(/WHERE status = 'completed'/i);
    expect(migration).toMatch(/Backfill badges using existing, explicitly completed bookshelf entries/i);
  });

  it('counts distinct completed books and refreshes achievement caches after shelf changes', () => {
    expect(distinctProgressFix).toMatch(/count\(DISTINCT book_id\)::integer/i);
    expect(bookshelfHook).toMatch(/queryKey: \['user-challenges'\]/);
    expect(bookshelfHook).toMatch(/queryKey: \['user-badges'\]/);
  });

  it('queries persisted challenge and badge records instead of returning mock data', () => {
    expect(challengeHook).toMatch(/from\('reading_challenges'\)/);
    expect(challengeHook).toMatch(/from\('user_challenges'\)/);
    expect(challengeHook).toMatch(/from\('user_reading_badges'\)/);
    expect(challengeHook).toMatch(/from\('reading_badges'\)/);
    expect(challengeHook).not.toMatch(/mockChallenges|mockUserChallenges|mockBadges|mock success/i);
  });
});
