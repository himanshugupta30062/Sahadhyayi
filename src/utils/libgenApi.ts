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
  try {
    const res = await secureFetch(`/api/libgen?q=${encodeURIComponent(query)}`);
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
    console.error('Error searching Libgen:', error);
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : 'Failed to search Libgen'
    };
  }
}
