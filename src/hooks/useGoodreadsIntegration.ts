import { secureFetch } from '../security/secureFetch';

export interface GoodreadsBook {
  id: string;
  title: string;
  author?: string;
  rating?: number;
  goodreadsId?: string;
}

export const useGoodreadsIntegration = () => {
  const initiateLogin = () => {
    window.open('/goodreads/connect', '_blank', 'width=600,height=600');
  };

  const importBooks = async () => {
    try {
      const res = await secureFetch('/goodreads/bookshelf');
      return res.json();
    } catch (e: any) {
      if (e.code === 'GOODREADS_NOT_LINKED') return null;
      throw e;
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
