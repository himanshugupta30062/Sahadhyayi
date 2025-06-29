import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a book cover image to the public `book-covers` bucket and
 * return the public URL of the uploaded file.
 */
export async function uploadBookCover(file: File, bookId: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image uploads allowed');
  }

  const bucket = 'book-covers';
  const safeBookId = bookId.replace(/^\/+|\/+$/g, '');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${safeBookId}/${Date.now()}_${safeName}`;

  await supabase.storage.createBucket(bucket, { public: true }).catch(() => ({ error: null }));

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
}

