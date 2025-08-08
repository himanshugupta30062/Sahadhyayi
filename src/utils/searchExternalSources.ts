import { SecurityMiddleware } from '@/utils/securityConfig';

export interface ExternalBook {
  id: string;
  title: string;
  author?: string;
  year?: string;
  language?: string;
  extension?: string;
  size?: string;
  md5: string;
  downloadUrl: string;
  source?: 'libgen' | 'open_access';
  publisher?: string;
}

function secureFetch(url: string) {
  return fetch(url, SecurityMiddleware.createSecureRequestOptions());
}

/**
 * Search external sources for books matching the query via secure backend proxy.
 */
export async function searchExternalSources(query: string): Promise<ExternalBook[]> {
  try {
    const res = await secureFetch(`/api/libgen?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Libgen request failed');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.books)) return [];
    return data.books.map((book: any) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      year: book.year,
      extension: book.format,
      size: book.size,
      md5: book.id,
      downloadUrl: book.mirrorLink,
      source: 'libgen',
      publisher: book.publisher,
    }));
  } catch (error) {
    console.warn('External source search failed:', error);
    return [];
  }
}
