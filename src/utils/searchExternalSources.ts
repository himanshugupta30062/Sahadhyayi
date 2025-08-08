import { secureFetch } from './security';

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
}

/**
 * Search external sources for books matching the query.
 * Uses a backend proxy to avoid CORS restrictions.
 * Returns an array of ExternalBook objects.
*/

interface LibgenProxyBook {
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

export async function searchExternalSources(query: string): Promise<ExternalBook[]> {
  try {
    const res = await secureFetch(`/api/libgen?q=${encodeURIComponent(query)}`);
    const data = (await res.json()) as { success: boolean; books: LibgenProxyBook[] };
    if (!data.success || !Array.isArray(data.books)) return [];
    return data.books.map((b) => ({
      id: b.id,
      md5: '',
      title: b.title,
      author: b.author,
      year: b.year,
      extension: b.format,
      size: b.size,
      downloadUrl: b.mirrorLink,
      source: 'libgen'
    }));
  } catch (err) {
    console.error('searchExternalSources error:', err);
    return [];
  }
}
