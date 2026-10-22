import { supabase } from '@/integrations/supabase/client-universal';

const PRIVATE_SOCIAL_MEDIA_PREFIX = 'storage://social-post-media/';
const SIGNED_URL_TTL_SECONDS = 15 * 60;

export function getPrivateSocialPostMediaPath(imageUrl?: string | null): string | null {
  if (!imageUrl?.startsWith(PRIVATE_SOCIAL_MEDIA_PREFIX)) return null;
  const path = imageUrl.slice(PRIVATE_SOCIAL_MEDIA_PREFIX.length);
  if (!path || path.startsWith('/') || path.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
    return null;
  }
  return path;
}

/**
 * Resolves new private social-media object markers into short-lived signed URLs.
 * Public URLs on older posts are left unchanged. Storage RLS checks the referenced
 * post's audience before allowing a non-owner to request a signed URL.
 */
export async function resolveSocialPostImages<T extends { image_url?: string | null }>(rows: T[]): Promise<T[]> {
  const privatePaths = Array.from(
    new Set(rows.map((row) => getPrivateSocialPostMediaPath(row.image_url)).filter((path): path is string => Boolean(path))),
  );
  if (privatePaths.length === 0) return rows;

  let signedUrls = new Map<string, string>();
  try {
    const { data, error } = await supabase
      .storage
      .from('social-post-media')
      .createSignedUrls(privatePaths, SIGNED_URL_TTL_SECONDS);

    if (error) throw error;
    signedUrls = new Map(
      (data || [])
        .filter((entry) => Boolean(entry.path && entry.signedUrl && !entry.error))
        .map((entry) => [entry.path as string, entry.signedUrl] as [string, string]),
    );
  } catch (error) {
    // Do not fail the post feed if media signing is unavailable. Private markers
    // must never be sent directly to the browser as though they were public URLs.
    console.warn('Could not resolve private social media URLs:', error);
  }

  return rows.map((row) => {
    const path = getPrivateSocialPostMediaPath(row.image_url);
    if (!path) return row;
    return { ...row, image_url: signedUrls.get(path) } as T;
  });
}
