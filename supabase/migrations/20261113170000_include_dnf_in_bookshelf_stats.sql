-- Extend bookshelf stats with a dedicated DNF count.
CREATE OR REPLACE FUNCTION public.get_user_bookshelf_stats(user_uuid UUID)
RETURNS TABLE (
  total_books BIGINT,
  reading_books BIGINT,
  completed_books BIGINT,
  want_to_read_books BIGINT,
  dnf_books BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'reading')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'want_to_read')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'dnf')::BIGINT
  FROM public.user_bookshelf
  WHERE user_id = user_uuid;
$$;

-- Keep the function callable only by authenticated clients; RLS still protects
-- the underlying rows and callers should pass their own user id.
REVOKE ALL ON FUNCTION public.get_user_bookshelf_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_bookshelf_stats(UUID) TO authenticated;
