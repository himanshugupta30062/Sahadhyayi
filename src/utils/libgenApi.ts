import { secureFetch } from "../security/secureFetch";

export interface LibgenBook {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  format?: string;
  size?: string;
  mirrorLink: string;
  source: 'libgen';
}

interface LibgenHtmlResponse {
  success: boolean;
  books: LibgenBook[];
  error?: string;
}

export async function searchLibgen(query: string): Promise<LibgenHtmlResponse> {
  const clean = (query || '').trim();
  if (!clean) {
    return { success: false, books: [] };
  }

  // On client static hosting without serverless /api route, avoid triggering 404 console noise
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.origin.includes(':3000')) {
    return {
      success: false,
      books: [],
      error: 'Libgen proxy is only enabled on local dev proxies or supported API backends.',
    };
  }

  try {
    const res = await secureFetch(`/api/libgen?q=${encodeURIComponent(clean)}`);
    if (!res.ok) {
      return {
        success: false,
        books: [],
        error: `Libgen search unavailable (status ${res.status})`,
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        books: [],
        error: 'Invalid response format from Libgen service',
      };
    }
    return await res.json();
  } catch (error) {
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : 'Failed to search Libgen'
    };
  }
}
