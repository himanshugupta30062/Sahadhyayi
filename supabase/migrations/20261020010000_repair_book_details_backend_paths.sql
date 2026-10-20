-- Repair Book Details data paths and community access without exposing voter identities.
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS book_id uuid;

UPDATE public.content_feedback
SET book_id = substring(comment from '"bookId"\s*:\s*"([0-9a-fA-F-]{36})"')::uuid
WHERE book_id IS NULL
  AND comment ~ '"bookId"\s*:\s*"[0-9a-fA-F-]{36}"';

CREATE INDEX IF NOT EXISTS idx_content_feedback_book_type_created
  ON public.content_feedback (book_id, feedback_type, created_at DESC)
  WHERE book_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_votes_content_type
  ON public.content_votes (content_id, vote_type);

DROP POLICY IF EXISTS "Read published book feedback" ON public.content_feedback;
CREATE POLICY "Read published book feedback" ON public.content_feedback
  FOR SELECT TO anon, authenticated
  USING (
    book_id IS NOT NULL
    AND feedback_type IN ('idea', 'issue', 'improvement', 'reader_comment')
  );

CREATE OR REPLACE FUNCTION public.get_book_feedback_vote_summary(p_content_ids uuid[])
RETURNS TABLE(content_id uuid, vote_type text, vote_count bigint, viewer_voted boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT v.content_id, v.vote_type, count(*)::bigint,
         COALESCE(bool_or(v.user_id = auth.uid()), false)
  FROM public.content_votes AS v
  JOIN public.content_feedback AS f ON f.id = v.content_id
  WHERE p_content_ids IS NOT NULL
    AND v.content_id = ANY (p_content_ids)
    AND f.book_id IS NOT NULL
    AND f.feedback_type IN ('idea', 'issue', 'improvement', 'reader_comment')
  GROUP BY v.content_id, v.vote_type;
$function$;
REVOKE ALL ON FUNCTION public.get_book_feedback_vote_summary(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_book_feedback_vote_summary(uuid[]) TO anon, authenticated;

-- Chapter progress uses the canonical books_library IDs used by Book Details.
ALTER TABLE public.detailed_reading_progress
  DROP CONSTRAINT IF EXISTS detailed_reading_progress_book_id_fkey;
ALTER TABLE public.detailed_reading_progress
  ADD CONSTRAINT detailed_reading_progress_book_id_fkey
  FOREIGN KEY (book_id) REFERENCES public.books_library(id) ON DELETE CASCADE;

-- Keep the legacy book_id for backwards compatibility, and map summaries to canonical IDs.
ALTER TABLE public.book_audio_summaries
  ADD COLUMN IF NOT EXISTS library_book_id uuid REFERENCES public.books_library(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS book_audio_summaries_library_book_id_unique
  ON public.book_audio_summaries(library_book_id);

UPDATE public.book_audio_summaries
SET library_book_id = '35194597-5087-45df-8680-30db00f1b706'::uuid
WHERE book_id = '2dac3c86-1314-4b1c-8e50-dd9320148d84'::uuid
  AND library_book_id IS NULL;
UPDATE public.book_audio_summaries
SET library_book_id = '1d3854e7-e69f-426e-9839-8afea530b9f2'::uuid
WHERE book_id = 'fa3bbee9-198d-4c4f-8997-1c57bc0a8b55'::uuid
  AND library_book_id IS NULL;
UPDATE public.book_audio_summaries
SET library_book_id = 'c86783d4-da4e-4577-b7e8-d4c7bd669dfe'::uuid
WHERE book_id = '7cf856ba-c7da-4d6f-8d86-39608d9cf061'::uuid
  AND library_book_id IS NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-summaries', 'audio-summaries', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3'];

DROP POLICY IF EXISTS "Public can read audio summaries" ON storage.objects;
CREATE POLICY "Public can read audio summaries" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'audio-summaries');
DROP POLICY IF EXISTS "Authenticated users can upload audio summaries" ON storage.objects;
CREATE POLICY "Authenticated users can upload audio summaries" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio-summaries' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can create audio summaries" ON public.book_audio_summaries;
CREATE POLICY "Admins can create audio summaries" ON public.book_audio_summaries
  FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can update audio summaries" ON public.book_audio_summaries;
CREATE POLICY "Admins can update audio summaries" ON public.book_audio_summaries
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
