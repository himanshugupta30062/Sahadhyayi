import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('shareable literary quote cards', () => {
  const migration = read('../../supabase/migrations/20261023100000_add_shareable_quote_cards.sql');
  const composer = read('../../src/components/social/FeedComposer.tsx');
  const feed = read('../../src/components/social/EnhancedSocialFeed.tsx');
  const shareModal = read('../../src/components/social/ShareModal.tsx');
  const postsHook = read('../../src/hooks/useSocialPosts.ts');

  it('adds quote metadata without changing existing audience policies', () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS post_kind text NOT NULL DEFAULT 'post'/);
    expect(migration).toMatch(/quote_text text/);
    expect(migration).toMatch(/quote_author text/);
    expect(migration).toMatch(/quote_source text/);
    expect(migration).toMatch(/quote_context text/);
    expect(migration).toMatch(/length\(btrim\(quote_text\)\) BETWEEN 1 AND 500/);
    expect(migration).not.toMatch(/CREATE POLICY|DROP POLICY|ENABLE ROW LEVEL SECURITY/i);
  });

  it('lets readers compose a quote with attribution, a source, and personal context', () => {
    expect(composer).toMatch(/Quote card/);
    expect(composer).toMatch(/aria-label="Quote text"/);
    expect(composer).toMatch(/aria-label="Quote author"/);
    expect(composer).toMatch(/aria-label="Quote source"/);
    expect(composer).toMatch(/aria-label="Why this quote matters"/);
    expect(composer).toMatch(/post_kind: postKind/);
    expect(postsHook).toMatch(/quote_context: postData\.post_kind === 'quote'/);
  });

  it('renders attributed cards and includes quote context in share text', () => {
    expect(feed).toMatch(/aria-label="Shareable literary quote"/);
    expect(feed).toMatch(/Copy quote/);
    expect(feed).toMatch(/quoteText=\{selectedPost\.quote_text\}/);
    expect(shareModal).toMatch(/quoteContext\?\.trim\(\)/);
    expect(shareModal).toMatch(/currentUrl/);
  });
});
