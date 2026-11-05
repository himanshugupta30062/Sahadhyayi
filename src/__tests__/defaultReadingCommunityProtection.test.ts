import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const toPath = (relPath: string) => fileURLToPath(new URL(relPath, import.meta.url));

const migration = readFileSync(
  toPath('../../supabase/migrations/20261029200000_protect_default_reading_community_membership.sql'),
  'utf8',
);
const groupDetails = readFileSync(toPath('../pages/GroupDetails.tsx'), 'utf8');
const groupCard = readFileSync(toPath('../components/groups/GroupCard.tsx'), 'utf8');
const groupDirectory = readFileSync(toPath('../components/groups/ReadingGroupsDirectory.tsx'), 'utf8');
const groupManagement = readFileSync(toPath('../hooks/useGroupManagement.ts'), 'utf8');

describe('permanent default reading community membership', () => {
  it('auto-joins existing and newly registered users in the active group system', () => {
    expect(migration).toMatch(/INSERT INTO public\.group_chat_members[\s\S]*FROM auth\.users/i);
    expect(migration).toMatch(/INSERT INTO public\.group_chat_members[\s\S]*NEW\.id[\s\S]*ON CONFLICT \(group_id, user_id\) DO NOTHING/i);
  });

  it('blocks deleting or moving a default community membership at the database layer', () => {
    expect(migration).toMatch(/CREATE TRIGGER protect_default_reading_community_membership[\s\S]*BEFORE DELETE OR UPDATE ON public\.group_chat_members/i);
    expect(migration).toMatch(/You cannot leave the Sahadhyayi Community Reading Circle/i);
    expect(migration).toMatch(/Membership in the Sahadhyayi Community Reading Circle cannot be changed/i);
    expect(migration).toMatch(/CREATE TRIGGER protect_legacy_default_reading_community_membership[\s\S]*BEFORE DELETE OR UPDATE ON public\.group_members/i);
  });

  it('protects the default group from deletion and renaming', () => {
    expect(migration).toMatch(/CREATE TRIGGER protect_default_reading_community_group[\s\S]*BEFORE DELETE OR UPDATE ON public\.group_chats/i);
    expect(migration).toMatch(/The Sahadhyayi Community Reading Circle cannot be deleted/i);
    expect(migration).toMatch(/The default community group name cannot be changed/i);
    expect(migration).toMatch(/CREATE TRIGGER protect_legacy_default_reading_community_group[\s\S]*BEFORE DELETE OR UPDATE ON public\.groups/i);
  });

  it('does not offer a leave action for the default community in group screens', () => {
    expect(groupDetails).toMatch(/isDefaultReadingGroup \? \([\s\S]*Permanent Community Member/);
    expect(groupDirectory).toMatch(/group\.name === DEFAULT_READING_GROUP_NAME \? \([\s\S]*Permanent Community Member/);
    expect(groupCard).toMatch(/group\.name === DEFAULT_READING_GROUP_NAME \? 'Permanent Community Member'/);
    expect(groupManagement).toMatch(/group\?\.name === DEFAULT_READING_GROUP_NAME[\s\S]*You cannot leave the Sahadhyayi Community Reading Circle/);
  });
});
