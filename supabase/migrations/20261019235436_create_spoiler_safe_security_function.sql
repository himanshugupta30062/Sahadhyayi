
GRANT USAGE ON SCHEMA internal_security TO authenticated;

CREATE OR REPLACE FUNCTION internal_security.spoiler_threads_safe_rows()
RETURNS TABLE (
  id uuid,
  book_id uuid,
  user_id uuid,
  title text,
  min_chapter integer,
  created_at timestamptz,
  updated_at timestamptz,
  body text,
  is_unlocked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    t.id,
    t.book_id,
    t.user_id,
    t.title,
    t.min_chapter,
    t.created_at,
    t.updated_at,
    CASE
      WHEN public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter
      THEN t.body
      ELSE NULL::text
    END AS body,
    (public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter) AS is_unlocked
  FROM public.spoiler_threads AS t
  WHERE auth.uid() IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION internal_security.spoiler_threads_safe_rows() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal_security.spoiler_threads_safe_rows() TO authenticated;
