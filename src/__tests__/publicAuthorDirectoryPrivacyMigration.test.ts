import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261117200000_public_author_directory_authentic_only.sql'),
  'utf8',
);

describe('public author directory privacy migration', () => {
  it('uses a fixed search path and schema-qualified author table', () => {
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain('FROM public.authors AS a');
  });

  it('excludes non-authentic author records from public lookup', () => {
    expect(migration).toContain('WHERE a.is_authentic IS TRUE');
  });

  it('preserves intended public directory RPC access', () => {
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.get_authors_data() FROM PUBLIC');
    expect(migration).toContain('TO anon, authenticated, service_role');
  });
});
