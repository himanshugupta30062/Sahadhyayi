/**
 * Helper utilities for generating secure Supabase Edge Function PDF proxy URLs
 * and detecting cross-origin PDF streaming compatibility.
 */

export const SUPABASE_PDF_PROXY_URL = 'https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/pdf-proxy';

const ALLOWED_PROXY_HOST_PATTERNS = [
  'gutenberg.org',
  'archive.org',
  'wikisource.org',
  'wikimedia.org',
  'standardebooks.org',
  'openlibrary.org',
  'loc.gov',
  'sahadhyayi.com',
  'supabase.co',
  'oapen.org',
  'google.com',
  'googleusercontent.com',
  'ncert.nic.in',
  'gitapress.org',
  'umn.edu',
  'github.io',
  'githubusercontent.com',
];

/**
 * Checks whether an external host is whitelisted by the Supabase pdf-proxy Edge Function.
 */
export function isWhitelistedProxyHost(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith('.edu')) return true;
    return ALLOWED_PROXY_HOST_PATTERNS.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

/**
 * Determines whether a URL is external and likely to encounter CORS restrictions in browsers.
 */
export function isCorsRestrictedPdf(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (['blob:', 'data:'].includes(parsed.protocol)) return false;
    if (typeof window !== 'undefined' && parsed.hostname === window.location.hostname) {
      return false;
    }
    // Supabase hosted assets already provide Access-Control-Allow-Origin: *
    if (parsed.hostname.endsWith('supabase.co')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Constructs a secure proxy URL to stream the PDF through our Supabase Edge Function with CORS headers.
 */
export function getProxiedPdfUrl(url: string, download = false, filename?: string): string {
  if (!url) return '';
  if (url.includes('/functions/v1/pdf-proxy')) return url;

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return url;

    // Check if host can be proxied
    if (!isWhitelistedProxyHost(url)) {
      return url;
    }

    const proxy = new URL(SUPABASE_PDF_PROXY_URL);
    proxy.searchParams.set('url', url);
    if (download) proxy.searchParams.set('download', '1');
    if (filename) proxy.searchParams.set('filename', filename);
    return proxy.toString();
  } catch {
    return url;
  }
}
