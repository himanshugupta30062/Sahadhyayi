import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261117210000_harden_public_authors_with_books_search_path.sql'),
  'utf8',
);

describe('public authors-with-books RPC hardening', () => {
  it('pins an empty search path and schema-qualifies both relations', () => {
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain('FROM public.authors AS a');
    expect(migration).toContain('public.books_library AS bl');
  });

  it('retains authentic authors with at least one linked book only', () => {
    expect(migration).toContain('WHERE a.is_authentic IS TRUE');
    expect(migration).toContain('HAVING COUNT(bl.id) > 0');
  });

  it('preserves intended public directory execution grants', () => {
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.get_authors_with_books() FROM PUBLIC');
    expect(migration).toContain('TO anon, authenticated, service_role');
  });
});
