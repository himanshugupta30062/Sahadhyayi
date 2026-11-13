-- User-created book reels (video uploads)
CREATE TABLE IF NOT EXISTS public.book_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  caption text NOT NULL CHECK (char_length(caption) BETWEEN 1 AND 500),
  book_title text,
  book_author text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_reels_created_at_idx ON public.book_reels(created_at DESC);
CREATE INDEX IF NOT EXISTS book_reels_user_id_idx ON public.book_reels(user_id);
ALTER TABLE public.book_reels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published book reels" ON public.book_reels;
CREATE POLICY "Anyone can view published book reels" ON public.book_reels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create own book reels" ON public.book_reels;
CREATE POLICY "Users can create own book reels" ON public.book_reels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own book reels" ON public.book_reels;
CREATE POLICY "Users can update own book reels" ON public.book_reels FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own book reels" ON public.book_reels;
CREATE POLICY "Users can delete own book reels" ON public.book_reels FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Private uploads: object paths are prefixed by the authenticated user's UUID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-reels', 'book-reels', true, 52428800, ARRAY['video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime'];
DROP POLICY IF EXISTS "Users upload own book reels" ON storage.objects;
CREATE POLICY "Users upload own book reels" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'book-reels' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Public can view book reel videos" ON storage.objects;
CREATE POLICY "Public can view book reel videos" ON storage.objects FOR SELECT
USING (bucket_id = 'book-reels');
DROP POLICY IF EXISTS "Users delete own book reel videos" ON storage.objects;
CREATE POLICY "Users delete own book reel videos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'book-reels' AND (storage.foldername(name))[1] = auth.uid()::text);
