export interface GoodreadsBook {
  id: string;
  title: string;
  author?: string;
  rating?: number;
  goodreadsId?: string;
}

import { secureFetch } from '@/lib/secureFetch';

export const useGoodreadsIntegration = () => {
  const initiateLogin = () => {
    window.open('/goodreads/connect', '_blank', 'width=600,height=600');
  };

  const importBooks = async () => {
    try {
      const res = await secureFetch('/goodreads/bookshelf');
      return res.json();
    } catch (err: any) {
      if (err.code === 'GOODREADS_NOT_LINKED') {
        return { error: 'GOODREADS_NOT_LINKED' } as any;
      }
      throw err;
    }
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
