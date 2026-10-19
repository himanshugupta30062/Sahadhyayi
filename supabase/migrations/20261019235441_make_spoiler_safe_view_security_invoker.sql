
CREATE OR REPLACE VIEW public.spoiler_threads_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  book_id,
  user_id,
  title,
  min_chapter,
  created_at,
  updated_at,
  body,
  is_unlocked
FROM internal_security.spoiler_threads_safe_rows();

GRANT SELECT ON public.spoiler_threads_safe TO authenticated;
