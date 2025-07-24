export interface GoodreadsBook {
  id: string;
  title: string;
  author?: string;
  rating?: number;
  goodreadsId?: string;
}

export const useGoodreadsIntegration = () => {
  const initiateLogin = async () => {
    const res = await fetch('/goodreads/request-token');
    const data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank', 'width=600,height=600');
    } else {
      throw new Error('Failed to get Goodreads auth URL');
    }
  };

  const importBooks = async (userId: string) => {
    const res = await fetch(`/goodreads/bookshelf?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch bookshelf');
    return res.json();
  };

  const exportHistory = async (userId: string, books: GoodreadsBook[]) => {
    await fetch('/goodreads/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, books }),
    });
  };

  return { initiateLogin, importBooks, exportHistory };
};
