import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const migration = readFileSync(resolve(root, 'supabase/migrations/20261020210000_add_book_reviews.sql'), 'utf8');
const hook = readFileSync(resolve(root, 'src/hooks/useBookReviews.ts'), 'utf8');
const component = readFileSync(resolve(root, 'src/components/books/BookReviews.tsx'), 'utf8');

describe('persistent book reviews', () => {
  it('enforces one review per reader and book with bounded non-empty text', () => {
    expect(migration).toMatch(/unique \(book_id, user_id\)/i);
    expect(migration).toMatch(/char_length\(btrim\(review_text\)\) between 1 and 5000/i);
  });
  it('restricts review writes to the owning authenticated reader', () => {
    expect(migration).toMatch(/auth\.uid\(\) = user_id/i);
    expect(migration).toMatch(/revoke all on public\.book_reviews from anon/i);
    expect(hook).toMatch(/eq\('user_id', user\.id\)/);
  });
  it('supports spoiler-aware reviews and durable upsert/delete flows', () => {
    expect(hook).toMatch(/contains_spoilers/);
    expect(hook).toMatch(/onConflict: 'book_id,user_id'/);
    expect(component).toMatch(/Reveal spoilers/);
    expect(component).toMatch(/Publish review/);
  });
});
