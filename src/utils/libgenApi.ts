import { secureFetch } from '@/lib/secureFetch';

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

export async function searchLibgen(
  query: string
): Promise<LibgenHtmlResponse> {
  try {
    const res = await secureFetch(
      `/api/libgen?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return data as LibgenHtmlResponse;
  } catch (error) {
    console.error('Error searching Libgen:', error);
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : 'Failed to search Libgen',
    };
  }
}