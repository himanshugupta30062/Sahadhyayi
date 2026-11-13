-- Privacy-safe aggregate RPC for reader experience metadata.
-- Aggregates community-tagged moods, pacing, and content warnings across readers without
-- exposing user_ids or individual reader submissions (preserving feedback & vote privacy).

CREATE OR REPLACE FUNCTION public.get_book_experience_summary(p_book_ids uuid[])
RETURNS TABLE (
  book_id uuid,
  moods text[],
  pacing text,
  content_warnings text[],
  community_tags_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH expanded_moods AS (
    SELECT
      bet.book_id,
      m.mood,
      count(*) AS mood_count
    FROM public.book_experience_tags bet,
         LATERAL unnest(bet.moods) AS m(mood)
    WHERE bet.book_id = ANY(p_book_ids)
    GROUP BY bet.book_id, m.mood
  ),
  ranked_moods AS (
    SELECT
      em.book_id,
      array_agg(em.mood ORDER BY em.mood_count DESC) AS aggregated_moods
    FROM expanded_moods em
    GROUP BY em.book_id
  ),
  expanded_warnings AS (
    SELECT
      bet.book_id,
      w.warning
    FROM public.book_experience_tags bet,
         LATERAL unnest(bet.content_warnings) AS w(warning)
    WHERE bet.book_id = ANY(p_book_ids)
    GROUP BY bet.book_id, w.warning
  ),
  ranked_warnings AS (
    SELECT
      ew.book_id,
      array_agg(ew.warning) AS aggregated_warnings
    FROM expanded_warnings ew
    GROUP BY ew.book_id
  ),
  consensus_pacing AS (
    SELECT DISTINCT ON (bet.book_id)
      bet.book_id,
      bet.pacing
    FROM public.book_experience_tags bet
    WHERE bet.book_id = ANY(p_book_ids) AND bet.pacing IS NOT NULL
    GROUP BY bet.book_id, bet.pacing
    ORDER BY bet.book_id, count(*) DESC
  ),
  counts AS (
    SELECT
      bet.book_id,
      count(*)::bigint AS tag_count
    FROM public.book_experience_tags bet
    WHERE bet.book_id = ANY(p_book_ids)
    GROUP BY bet.book_id
  )
  SELECT
    b.id AS book_id,
    coalesce(rm.aggregated_moods, ARRAY[]::text[]) AS moods,
    cp.pacing,
    coalesce(rw.aggregated_warnings, ARRAY[]::text[]) AS content_warnings,
    coalesce(c.tag_count, 0::bigint) AS community_tags_count
  FROM unnest(p_book_ids) AS b(id)
  LEFT JOIN ranked_moods rm ON rm.book_id = b.id
  LEFT JOIN consensus_pacing cp ON cp.book_id = b.id
  LEFT JOIN ranked_warnings rw ON rw.book_id = b.id
  LEFT JOIN counts c ON c.book_id = b.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_book_experience_summary(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_book_experience_summary(uuid[]) TO anon, authenticated;

COMMENT ON FUNCTION public.get_book_experience_summary(uuid[]) IS
  'Returns privacy-preserving aggregated moods, consensus pacing, and community content warnings for books without exposing reader identities.';
