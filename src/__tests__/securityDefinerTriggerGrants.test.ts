import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../../supabase/migrations/20261029210000_restrict_trigger_function_execute.sql', import.meta.url),
  'utf8',
);

describe('trigger-only SECURITY DEFINER execute grants migration', () => {
  it('revokes client-role execution from trigger-only functions without dropping triggers', () => {
    const triggerFunctions = [
      'join_default_reading_community',
      'protect_default_reading_community_group',
      'protect_default_reading_community_membership',
      'protect_legacy_default_reading_community_group',
      'protect_legacy_default_reading_community_membership',
    ];

    for (const functionName of triggerFunctions) {
      expect(migration).toContain(
        'REVOKE EXECUTE ON FUNCTION public.' + functionName + '() FROM PUBLIC, anon, authenticated',
      );
    }
    expect(migration).not.toMatch(/DROP TRIGGER|DROP FUNCTION/i);
  });
});
