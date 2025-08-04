import { useCallback, useEffect, useState } from 'react';
import BookCard from '@/components/books/BookCard';
import { useAuth } from '@/contexts/AuthContext';

const MyLibrary = () => {
  const { user } = useAuth();
  const [shelf, setShelf] = useState<any[]>([]);

  const fetchShelf = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/shelf`);
      if (res.ok) {
        const data = await res.json();
        setShelf(data);
      }
    } catch (err) {
      console.error('Failed to load shelf', err);
    }
  }, [user]);

  useEffect(() => {
    fetchShelf();
  }, [fetchShelf]);

  useEffect(() => {
    window.addEventListener('shelfUpdated', fetchShelf);
    return () => window.removeEventListener('shelfUpdated', fetchShelf);
  }, [fetchShelf]);

  if (!user) {
    return <div className="text-center text-gray-600">Sign in to view your library.</div>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shelf.map((book) => (
        <BookCard key={book.id} book={book} onAdded={fetchShelf} />
      ))}
    </div>
  );
};

export default MyLibrary;
