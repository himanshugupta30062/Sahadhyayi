export interface GoodreadsBook {
  id: string;
  title: string;
  author?: string;
  rating?: number;
  goodreadsId?: string;
}

import { secureFetch } from '@/lib/secureFetch';

export const useGoodreadsIntegration = () => {
  const initiateLogin = async () => {
    const res = await secureFetch('/goodreads/connect');
    const data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank', 'width=600,height=600');
    } else {
      throw new Error('Failed to get Goodreads auth URL');
    }
  };

  const importBooks = async () => {
    const res = await secureFetch('/goodreads/bookshelf');
    if (!res.ok) throw new Error('Failed to fetch bookshelf');
    return res.json();
  };

  const exportHistory = async (books: GoodreadsBook[]) => {
    await secureFetch('/goodreads/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books }),
    });
  };

  return { initiateLogin, importBooks, exportHistory };
};
