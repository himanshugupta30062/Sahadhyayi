import { supabase } from '@/integrations/supabase/client';
import { validateFileUpload } from '@/utils/security';
import { SECURITY_CONFIG } from '@/utils/securityConfig';

/**
 * Upload a book cover image to the `book-covers` bucket in Supabase Storage.
 * Ensures the bucket exists and returns the public URL of the uploaded image.
 */
export async function uploadBookCover(
  file: File,
  bookId: string,
): Promise<string> {
  const bucket = 'book-covers';
  const filePath = `${bookId}/${Date.now()}_${file.name}`;

  const { valid, error } = validateFileUpload(
    file,
    SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
    SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE
  );
  if (!valid) {
    throw new Error(error);
  }

  // Create the bucket if it doesn't already exist
  await supabase.storage
    .createBucket(bucket, { public: true })
    .catch(() => ({ error: null }));

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath).data.publicUrl;

  return publicUrl;
}
