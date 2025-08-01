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
 * Since direct CORS requests to libgen.gs fail in browsers,
 * we'll return an empty array for now and recommend using a backend proxy.
 * Returns an array of ExternalBook objects.
 */
export async function searchExternalSources(query: string): Promise<ExternalBook[]> {
  // TODO: Implement backend proxy for libgen.gs to avoid CORS issues
  // For now, return empty array to prevent CORS errors
  console.warn('External source search disabled due to CORS restrictions. Consider implementing a backend proxy.');
  return [];
  
  /* 
   * Original libgen implementation (commented out due to CORS):
   * 
   * const encoded = encodeURIComponent(query);
   * const url = `https://libgen.gs/search.php?req=${encoded}&res=20&format=json`;
   * 
   * try {
   *   const res = await fetch(url);
   *   if (!res.ok) throw new Error('Libgen request failed');
   *   const data = await res.json();
   * 
   *   if (!Array.isArray(data)) return [];
   * 
   *   return data.map((item: any) => {
   *     const md5: string = item.md5;
   *     return {
   *       id: md5,
   *       md5,
   *       title: item.title || 'Unknown Title',
   *       author: item.author,
   *       year: item.year,
   *       language: item.language,
   *       extension: item.extension,
   *       size: item.filesize || item.filesize_size || item.size,
   *       downloadUrl: `http://library.lol/main/${md5}`
   *     } as ExternalBook;
   *   });
   * } catch (err) {
   *   console.error('searchExternalSources error:', err);
   *   return [];
   * }
   */
}
