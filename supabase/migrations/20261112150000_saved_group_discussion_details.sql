-- Saved discussion details use the same progress and profile fields as the
-- canonical chapter-discussion RPC. Never reveal spoiler content prematurely.
CREATE OR REPLACE FUNCTION public.get_saved_group_reading_discussions(p_discussion_ids uuid[])
RETURNS TABLE (
  id uuid, group_id uuid, title text, body text, book_title text,
  author_name text, topic_type text, chapter_number integer,
  spoiler_chapter integer, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT d.id, d.group_id, d.title,
    CASE WHEN d.created_by = v_actor OR d.spoiler_chapter = 0
      OR COALESCE(progress.current_chapter, 0) >= d.spoiler_chapter
      THEN d.body ELSE NULL END,
    book.title,
    COALESCE(profile.full_name, profile.name, 'Reader'),
    d.topic_type, d.chapter_number, d.spoiler_chapter, d.created_at
  FROM public.group_reading_discussion_bookmarks bm
  JOIN public.group_reading_discussions d ON d.id = bm.discussion_id
  JOIN public.group_reading_books grb ON grb.id = d.group_reading_book_id AND grb.group_id = d.group_id
  JOIN public.books_library book ON book.id = grb.book_id
  LEFT JOIN public.profiles profile ON profile.id = d.created_by
  JOIN public.group_chat_members member ON member.group_id = d.group_id
    AND member.user_id = v_actor AND member.status = 'active'
  LEFT JOIN LATERAL (
    SELECT COALESCE(max(rp.chapter_number), 0)::integer AS current_chapter
    FROM public.detailed_reading_progress rp
    WHERE rp.user_id = v_actor AND rp.book_id = grb.book_id
      AND rp.completion_percentage >= 100
  ) progress ON true
  WHERE bm.user_id = v_actor
    AND d.id = ANY(COALESCE(p_discussion_ids, '{}'::uuid[]));
END;
$function$;
REVOKE ALL ON FUNCTION public.get_saved_group_reading_discussions(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_saved_group_reading_discussions(uuid[]) TO authenticated;
