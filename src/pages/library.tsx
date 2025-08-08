import React, { useEffect, useMemo, useState } from 'react';
import { secureFetch } from '@/lib/secureFetch';
import { useLocation } from 'react-router-dom';

const useRouter = () => {
  const { search } = useLocation();
  const query = useMemo(() => {
    const params = new URLSearchParams(search);
    return Object.fromEntries(params.entries());
  }, [search]);
  return { query };
};

interface Book {
  id: string;
  title: string;
  author?: string;
}

async function fetchBooks({ q, genre }: { q?: string; genre?: string }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (genre) params.set('genre', genre);
  const res = await secureFetch(`/api/books?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch books');
  }
  return res.json();
}

const Library = () => {
  const router = useRouter();
  const { q, genre } = router.query as { q?: string; genre?: string };
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetchBooks({ q, genre })
      .then(setBooks)
      .catch(() => setBooks([]));
  }, [q, genre]);

  return (
    <div>
      {books.map((book) => (
        <div key={book.id}>
          <h2>{book.title}</h2>
          {book.author && <p>{book.author}</p>}
        </div>
      ))}
    </div>
  );
};

export default Library;
