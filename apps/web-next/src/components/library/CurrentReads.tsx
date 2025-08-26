'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../integrations/supabase/client';
import { getCurrentReads, type CurrentRead } from '@/lib/supabase/userBooks';

export default function CurrentReads() {
  const [userId, setUserId] = useState<string | null>(null);
  const [reads, setReads] = useState<CurrentRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        setUserId(user.id);
        getCurrentReads(user.id)
          .then(setReads)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (!userId) {
    return (
      <div className="p-4 text-center" data-testid="current-reads">
        <p>Sign in to track your reading progress.</p>
        <Link href="/sign-in" className="text-blue-600 underline">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4" data-testid="current-reads">
        Loading...
      </div>
    );
  }

  if (reads.length === 0) {
    return (
      <div className="p-4 text-center" data-testid="current-reads">
        <p>No current reads.</p>
        <Link href="/library" className="text-blue-600 underline">
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4" data-testid="current-reads">
      {reads.map((item) => (
        <Link key={item.book_id} href={`/library/${item.book.id}`} className="block text-sm">
          <div className="aspect-[2/3] w-full overflow-hidden rounded bg-gray-100">
            <img
              src={
                item.book.cover_image_url ??
                'https://placehold.co/200x300?text=No+Cover'
              }
              alt={item.book.title}
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-1 truncate">{item.book.title}</p>
        </Link>
      ))}
    </div>
  );
}
