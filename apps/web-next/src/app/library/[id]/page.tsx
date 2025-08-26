import BookActions from '../../../components/library/BookActions';
import { supabase } from '@/integrations/supabase/client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function BookPage({ params }: PageProps) {
  const { id } = params;
  const { data: book } = await supabase
    .from('books_library')
    .select('*, authors(*)')
    .eq('id', id)
    .maybeSingle();

  if (!book) {
    return <div className="p-4">Book not found</div>;
  }

  const { data: related } = await supabase
    .from('books_library')
    .select('id, title, cover_image_url')
    .eq('author_id', book.author_id)
    .neq('id', book.id)
    .limit(6);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{book.title}</h1>
        {book.authors && <p className="text-gray-600">{book.authors.name}</p>}
      </div>
      <BookActions bookId={book.id} fileUrl={book.pdf_url} />
      {related && related.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mt-6">Related Books</h2>
          <ul className="list-disc ml-5">
            {related.map((rb) => (
              <li key={rb.id}>{rb.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

