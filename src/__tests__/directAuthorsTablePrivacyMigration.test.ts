import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261117220000_scope_direct_author_reads.sql'),
  'utf8',
);

describe('direct authors table read privacy migration', () => {
  it('removes the unrestricted public author read policy', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Anyone can view author public info" ON public.authors');
  });

  it('limits anonymous reads to authentic authors', () => {
    expect(migration).toContain('TO anon');
    expect(migration).toContain('USING (is_authentic IS TRUE)');
  });

  it('preserves admin moderation access without exposing non-authentic rows to ordinary users', () => {
    expect(migration).toContain('TO authenticated');
    expect(migration).toContain('USING (is_authentic IS TRUE OR public.is_admin())');
  });
});
