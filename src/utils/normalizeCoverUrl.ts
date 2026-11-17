/**
 * Returns a usable HTTP(S) book-cover URL.
 *
 * Archive.org service thumbnails can resolve successfully while showing blank
 * scan backs or generic item imagery. Known placeholder URLs are treated as
 * missing so the cover resolver can find a real jacket image.
 */
export function normalizeCoverUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || /^(null|undefined)$/i.test(trimmed)) return null;

  // Same-origin storage paths are valid image sources too.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  const candidate = `${host}${path}`;

  if (
    /placeholder|no[-_]?cover|nocover|image[-_]?not[-_]?available|default[-_]?cover|blank[-_]?cover/i.test(candidate) ||
    parsed.searchParams.get('id') === 'ryQBzwEACAAJ'
  ) {
    return null;
  }

  if (host === 'archive.org' && path.startsWith('/services/img/')) return null;

  return trimmed;
}
