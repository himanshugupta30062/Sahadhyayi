import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const bookmarks = read('../../supabase/migrations/20261112140000_group_discussion_bookmarks.sql');
const savedDetails = read('../../supabase/migrations/20261112150000_saved_group_discussion_details.sql');
const page = read('../components/groups/SavedGroupDiscussions.tsx');
const app = read('../App.tsx');
const navigation = read('../components/Navigation.tsx');

describe('Saved Reading Group discussions', () => {
  it('keeps bookmarks unique per reader and discussion and inaccessible through direct table grants', () => {
    expect(bookmarks).toMatch(/unique\s*\(discussion_id\s*,\s*user_id\)/i);
    expect(bookmarks).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(bookmarks).toMatch(/REVOKE ALL ON public\.group_reading_discussion_bookmarks FROM public, anon, authenticated/i);
  });

  it('allows bookmark RPCs only to authenticated active group members', () => {
    expect(bookmarks).toMatch(/auth\.uid\(\)/);
    expect(bookmarks).toMatch(/m\.status\s*=\s*'active'/i);
    expect(bookmarks).toMatch(/GRANT EXECUTE ON FUNCTION public\.toggle_group_reading_discussion_bookmark\(uuid\) TO authenticated/i);
    expect(bookmarks).toMatch(/GRANT EXECUTE ON FUNCTION public\.list_my_group_discussion_bookmarks\(\) TO authenticated/i);
  });

  it('filters saved details by bookmark owner and active membership and applies spoiler progress', () => {
    expect(savedDetails).toMatch(/bm\.user_id\s*=\s*v_actor/i);
    expect(savedDetails).toMatch(/member\.status\s*=\s*'active'/i);
    expect(savedDetails).toMatch(/detailed_reading_progress/i);
    expect(savedDetails).toMatch(/completion_percentage\s*>=\s*100/i);
    expect(savedDetails).toMatch(/THEN d\.body ELSE NULL/i);
  });

  it('provides loading, empty, remove-bookmark and open-group affordances', () => {
    expect(page).toMatch(/Loading saved discussions/i);
    expect(page).toMatch(/No saved discussions yet/i);
    expect(page).toMatch(/toggle_group_reading_discussion_bookmark/i);
    expect(page).toMatch(/Open group/i);
  });

  it('mounts the page behind authentication and links it from Social navigation', () => {
    expect(app).toMatch(/path="\/groups\/saved-discussions"[\s\S]*?<ProtectedRoute>/);
    expect(app).toMatch(/SavedGroupDiscussions/);
    expect(navigation).toMatch(/Saved Discussions.*\/groups\/saved-discussions/);
  });
});
