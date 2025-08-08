import { secureFetch } from './security';

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

// Function to search Libgen via backend proxy
export async function searchLibgen(query: string): Promise<LibgenHtmlResponse> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await secureFetch(`/api/libgen?q=${encodedQuery}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching Libgen:', error);
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : 'Failed to search Libgen',
    };
  }
}