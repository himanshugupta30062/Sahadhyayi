'use client';

import { useRouter } from 'next/navigation';
import type { Book } from '@/lib/types';

interface Props {
  book: Book;
}

export default function BookCard({ book }: Props) {
  const router = useRouter();
  const cover = book.cover_url ?? 'https://placehold.co/200x300?text=No+Cover';

  return (
    <button
      onClick={() => router.push(`/library/${book.id}`)}
      className="text-left"
      aria-label={`View details for ${book.title}`}
      data-testid="book-card"
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded bg-gray-100">
        <img
          src={cover}
          alt={book.title}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold" data-testid="book-title">
        {book.title}
      </h3>
      <div className="mt-1 flex flex-wrap gap-1">
        {book.language && (
          <span className="rounded bg-gray-200 px-1 text-[10px] font-medium">
            {book.language}
          </span>
        )}
      </div>
    </button>
  );
}
