/**
 * Utilities for validating, resolving, and rendering Google Books and PDF previews safely.
 */

import { isValidUrl } from './validation';

export interface GoogleBooksVolumeDetails {
  id: string;
  embeddable: boolean;
  viewability: 'NO_PAGES' | 'PARTIAL' | 'ALL_PAGES' | 'UNKNOWN';
  webReaderLink?: string | null;
  previewLink?: string | null;
  infoLink?: string | null;
  title?: string | null;
  status: 'available' | 'restricted' | 'unknown' | 'invalid_id' | 'error';
}

/**
 * Extracts a safe Google Books Volume ID from a URL or raw ID string.
 */
export const extractGoogleBooksId = (urlOrId: string | null | undefined): string | null => {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // 1. Matches ?id=xyz or &id=xyz
  const matchParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchParam && matchParam[1]) {
    return matchParam[1];
  }

  // 2. Matches URL path pattern .../books/(content|reader|about...)?id=xyz or .../books/xyz
  const matchPath = trimmed.match(/books\.google\.[a-z.]+\/books(?:\/[^?#]*[?&]id=|\/)([a-zA-Z0-9_-]+)/i);
  if (matchPath && matchPath[1]) {
    return matchPath[1];
  }

  // 3. Plain Volume ID string without URL scheme or slash
  if (/^[a-zA-Z0-9_-]{8,24}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  return null;
};

/**
 * Sanitizes and validates a candidate reader URL.
 * Rejects dangerous schemes like javascript:, data:, file:, etc.
 */
export const validateReaderUrl = (rawUrl: string | null | undefined): {
  isValid: boolean;
  sanitizedUrl: string | null;
  isGoogleBooks: boolean;
  isPdf: boolean;
  googleBooksId: string | null;
} => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      sanitizedUrl: null,
      isGoogleBooks: false,
      isPdf: false,
      googleBooksId: null,
    };
  }

  const trimmed = rawUrl.trim();
  const googleBooksId = extractGoogleBooksId(trimmed);

  // Check if it's a plain Google Books ID without scheme
  if (googleBooksId && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      isValid: true,
      sanitizedUrl: `https://books.google.com/books?id=${googleBooksId}`,
      isGoogleBooks: true,
      isPdf: false,
      googleBooksId,
    };
  }

  // Validate URL protocol using standard parser
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:', 'blob:'].includes(parsed.protocol)) {
      return {
        isValid: false,
        sanitizedUrl: null,
        isGoogleBooks: false,
        isPdf: false,
        googleBooksId: null,
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isGoogleBooks = hostname.includes('books.google') || Boolean(googleBooksId);
    const isPdf =
      !isGoogleBooks &&
      (/\.pdf($|\?|#)/i.test(trimmed) ||
        /\/pdf\//i.test(trimmed) ||
        hostname.includes('archive.org') ||
        trimmed.includes('/pdf-proxy'));

    return {
      isValid: true,
      sanitizedUrl: trimmed,
      isGoogleBooks,
      isPdf,
      googleBooksId,
    };
  } catch {
    return {
      isValid: false,
      sanitizedUrl: null,
      isGoogleBooks: false,
      isPdf: false,
      googleBooksId: null,
    };
  }
};

/**
 * Constructs the standard Google Books embed URL.
 */
export const buildSafeGoogleBooksEmbedUrl = (googleBooksId: string): string => {
  const cleanId = extractGoogleBooksId(googleBooksId);
  if (!cleanId) return '';
  return `https://books.google.com/books?id=${encodeURIComponent(cleanId)}&lpg=PP1&pg=PP1&output=embed`;
};

/**
 * Appends viewer navigation parameters to a PDF URL without modifying or stripping signed query parameters.
 */
export const buildSafePdfEmbedUrl = (rawUrl: string, page = 1): string => {
  if (!rawUrl) return '';
  const pageNum = Math.max(1, Math.floor(page));

  try {
    const parsed = new URL(rawUrl);
    // Explicitly update only the fragment hash, preserving searchParams completely
    parsed.hash = `toolbar=1&navpanes=1&scrollbar=1&page=${pageNum}`;
    return parsed.toString();
  } catch {
    const [base] = rawUrl.split('#');
    return `${base}#toolbar=1&navpanes=1&scrollbar=1&page=${pageNum}`;
  }
};

/**
 * Probes the Google Books public Volume API to determine if inline embedding is permitted by the publisher.
 */
export const checkGoogleBooksEmbeddability = async (
  googleBooksId: string,
  timeoutMs = 4500
): Promise<GoogleBooksVolumeDetails> => {
  const cleanId = extractGoogleBooksId(googleBooksId);
  if (!cleanId) {
    return {
      id: googleBooksId,
      embeddable: false,
      viewability: 'UNKNOWN',
      status: 'invalid_id',
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const endpoint = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(
      cleanId
    )}?fields=id,volumeInfo(title,previewLink,infoLink),accessInfo(embeddable,viewability,webReaderLink)`;

    const res = await fetch(endpoint, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          id: cleanId,
          embeddable: false,
          viewability: 'NO_PAGES',
          status: 'restricted',
        };
      }
      return {
        id: cleanId,
        embeddable: true,
        viewability: 'UNKNOWN',
        status: 'unknown',
      };
    }

    const data = await res.json();
    const accessInfo = data.accessInfo || {};
    const volumeInfo = data.volumeInfo || {};

    const embeddable = Boolean(accessInfo.embeddable);
    const viewability = (accessInfo.viewability as any) || 'UNKNOWN';

    // If embeddable is explicitly false or viewability is NO_PAGES, Google Books blocks iframe embedding
    if (!embeddable || viewability === 'NO_PAGES') {
      return {
        id: cleanId,
        embeddable: false,
        viewability,
        webReaderLink: accessInfo.webReaderLink || null,
        previewLink: volumeInfo.previewLink || null,
        infoLink: volumeInfo.infoLink || null,
        title: volumeInfo.title || null,
        status: 'restricted',
      };
    }

    return {
      id: cleanId,
      embeddable: true,
      viewability,
      webReaderLink: accessInfo.webReaderLink || null,
      previewLink: volumeInfo.previewLink || null,
      infoLink: volumeInfo.infoLink || null,
      title: volumeInfo.title || null,
      status: 'available',
    };
  } catch {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      id: cleanId,
      embeddable: true,
      viewability: 'UNKNOWN',
      status: 'unknown',
    };
  }
};

