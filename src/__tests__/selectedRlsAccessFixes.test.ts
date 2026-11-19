import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261119221830_26f58a8f-44cc-49ac-aa0d-ee51f4b41886.sql'),
  'utf8',
);

describe('selected public data access fixes', () => {
  it('limits research category access to signed-in non-guest readers', () => {
    expect(migration).toMatch(/REVOKE SELECT ON TABLE public\.research_paper_categories FROM anon/i);
    expect(migration).toMatch(/TO authenticated[\s\S]*auth\.uid\(\)[\s\S]*is_anonymous/i);
  });

  it('shows public collection metadata only when published profiles exist', () => {
    expect(migration).toMatch(/CREATE POLICY "Public read collections with published profiles"[\s\S]*EXISTS[\s\S]*person\.published IS TRUE/i);
    expect(migration).not.toMatch(/CREATE POLICY "Public read collections with published profiles"[\s\S]*USING \(true\)/i);
  });

  it('validates and bounds public feedback submissions', () => {
    expect(migration).toMatch(/CREATE POLICY "Public can submit validated feedback"[\s\S]*length\(btrim\(name\)\) BETWEEN 1 AND 120/i);
    expect(migration).toMatch(/email ~\*/i);
    expect(migration).toMatch(/length\(btrim\(message\)\) BETWEEN 1 AND 3000/i);
    expect(migration).toMatch(/rating IS NULL OR rating BETWEEN 1 AND 5/i);
  });
});