import { describe, expect, it } from 'vitest';
import { requirePersistedSocialPost } from '@/lib/socialPosts';

describe('social post persistence confirmation', () => {
  it('returns the database row when an id confirms it was saved', () => {
    const post = { id: 'saved-post-id', content: 'A saved post' };

    expect(requirePersistedSocialPost(post)).toBe(post);
  });

  it.each([null, undefined, {}, { id: '' }])(
    'rejects a missing persisted row or id (%s)',
    (post) => {
      expect(() => requirePersistedSocialPost(post)).toThrow(
        'The post could not be confirmed as saved. Please try again.',
      );
    },
  );
});
