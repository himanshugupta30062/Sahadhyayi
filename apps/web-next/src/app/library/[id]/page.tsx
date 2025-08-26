/* eslint-disable @typescript-eslint/no-explicit-any */
import BookActions from '@/components/library/BookActions';
import { getBookById } from '@/lib/supabase/books';

export const dynamic = 'force-dynamic';

export default async function BookPage(props: any) {
  const book = await getBookById(props.params.id);

  if (!book) {
    return <div className="p-4">Book not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">{book.title}</h1>
      <BookActions bookId={book.id} fileUrl={book.pdf_url} />
    </div>
  );
}
