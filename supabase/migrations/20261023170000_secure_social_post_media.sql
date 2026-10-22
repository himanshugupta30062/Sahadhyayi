-- Use a dedicated private bucket for social-post images.
-- Do not change the existing "books" bucket: it also serves book covers and files.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-post-media',
  'social-post-media',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload their own social post media" ON storage.objects;
CREATE POLICY "Users can upload their own social post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Owners can access their own uploaded objects; other readers can access an image
-- only when a row they are allowed to read references that exact object and the
-- post owner matches the owner folder. RLS on public.posts supplies the audience
-- check (public/followers/friends/private) without opening posts or the bucket.
DROP POLICY IF EXISTS "Readers can access media for visible social posts" ON storage.objects;
CREATE POLICY "Readers can access media for visible social posts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'social-post-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.posts AS p
      WHERE p.image_url = 'storage://social-post-media/' || storage.objects.name
        AND p.user_id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own social post media" ON storage.objects;
CREATE POLICY "Users can delete their own social post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);


NOTIFY pgrst, 'reload schema';
