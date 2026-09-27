export function requirePersistedSocialPost<T extends { id?: string | null }>(
  post: T | null | undefined,
): T {
  if (!post?.id) {
    throw new Error('The post could not be confirmed as saved. Please try again.');
  }

  return post;
}
