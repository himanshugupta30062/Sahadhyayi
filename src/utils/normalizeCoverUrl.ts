export function normalizeCoverUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;

  // These providers' generic item thumbnails frequently return placeholder artwork
  // (including "image not available" and blank scan backs) while still returning HTTP 200.
  // Treat them as unresolved so the title/author lookup pipeline can find a real cover.
  let parsed: URL;
  try { parsed = new URL(trimmed); } catch { return null; }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  if (host === 'archive.org' && path.startsWith('/services/img/')) return null;
  if ((host === 'books.google.com' || host === 'books.googleusercontent.com') && path.includes('/books/content')) return null;
  if (/placeholder|no[-_]?cover|image[-_]?not[-_]?available|default[-_]?cover/i.test(`${host}${path}`)) return null;
  return trimmed;
}
