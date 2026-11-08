-- Reading Groups Phase 7: chapter-linked discussions with database-enforced spoiler safety.
-- Discussion text is served only through scoped RPCs; clients cannot read raw rows.

CREATE TABLE IF NOT EXISTS public.group_reading_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  group_reading_book_id uuid NOT NULL REFERENCES public.group_reading_books(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL DEFAULT 0
    CHECK (chapter_number BETWEEN 0 AND 10000),
  spoiler_chapter integer NOT NULL DEFAULT 0
    CHECK (spoiler_chapter BETWEEN 0 AND 10000),
  topic_type text NOT NULL DEFAULT 'discussion'
    CHECK (topic_type IN ('discussion', 'question', 'reflection', 'quote')),
  title text NOT NULL
    CHECK (char_length(btrim(title)) BETWEEN 3 AND 160),
  body text NOT NULL
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 6000),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_reading_discussions_spoiler_floor
    CHECK (spoiler_chapter = 0 OR spoiler_chapter >= chapter_number)
);

CREATE TABLE IF NOT EXISTS public.group_reading_discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL
    REFERENCES public.group_reading_discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 2500),
  spoiler_chapter integer NOT NULL DEFAULT 0
    CHECK (spoiler_chapter BETWEEN 0 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_reading_discussions_group_created_idx
  ON public.group_reading_discussions (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS group_reading_discussions_book_chapter_idx
  ON public.group_reading_discussions (group_reading_book_id, chapter_number, created_at DESC);
CREATE INDEX IF NOT EXISTS group_reading_discussion_comments_thread_created_idx
  ON public.group_reading_discussion_comments (discussion_id, created_at ASC);
CREATE INDEX IF NOT EXISTS group_reading_discussion_comments_user_idx
  ON public.group_reading_discussion_comments (user_id, created_at DESC);

ALTER TABLE public.group_reading_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reading_discussion_comments ENABLE ROW LEVEL SECURITY;

-- No direct Data API reads/writes. The authenticated RPCs below enforce group
-- membership and return body text only after the reader reaches the spoiler level.
REVOKE ALL ON TABLE public.group_reading_discussions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.group_reading_discussion_comments FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_group_reading_discussions(
  p_group_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  group_id uuid,
  group_reading_book_id uuid,
  book_id uuid,
  book_title text,
  chapter_number integer,
  spoiler_chapter integer,
  topic_type text,
  title text,
  body text,
  is_unlocked boolean,
  created_by uuid,
  author_name text,
  author_photo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  reply_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.group_chat_members AS member_row
    WHERE member_row.group_id = p_group_id
      AND member_row.user_id = v_actor
      AND member_row.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active group membership required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    discussion.id,
    discussion.group_id,
    discussion.group_reading_book_id,
    reading_book.book_id,
    book.title,
    discussion.chapter_number,
    discussion.spoiler_chapter,
    discussion.topic_type,
    discussion.title,
    CASE
      WHEN discussion.created_by = v_actor
        OR discussion.spoiler_chapter = 0
        OR COALESCE(reader_progress.current_chapter, 0) >= discussion.spoiler_chapter
      THEN discussion.body
      ELSE NULL
    END,
    (
      discussion.created_by = v_actor
      OR discussion.spoiler_chapter = 0
      OR COALESCE(reader_progress.current_chapter, 0) >= discussion.spoiler_chapter
    ),
    discussion.created_by,
    COALESCE(author_profile.full_name, author_profile.name, 'Reader'),
    author_profile.profile_photo_url,
    discussion.created_at,
    discussion.updated_at,
    (
      SELECT count(*)::integer
      FROM public.group_reading_discussion_comments AS reply
      WHERE reply.discussion_id = discussion.id
    )
  FROM public.group_reading_discussions AS discussion
  JOIN public.group_reading_books AS reading_book
    ON reading_book.id = discussion.group_reading_book_id
   AND reading_book.group_id = discussion.group_id
  JOIN public.books_library AS book ON book.id = reading_book.book_id
  LEFT JOIN public.profiles AS author_profile
    ON author_profile.id = discussion.created_by
  LEFT JOIN LATERAL (
    SELECT COALESCE(max(progress.chapter_number), 0)::integer AS current_chapter
    FROM public.detailed_reading_progress AS progress
    WHERE progress.user_id = v_actor
      AND progress.book_id = reading_book.book_id
      AND progress.completion_percentage >= 100
  ) AS reader_progress ON true
  WHERE discussion.group_id = p_group_id
  ORDER BY discussion.created_at DESC, discussion.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_group_reading_discussion(
  p_group_id uuid,
  p_group_reading_book_id uuid,
  p_chapter_number integer,
  p_spoiler_chapter integer,
  p_topic_type text,
  p_title text,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_discussion_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.group_chat_members AS member_row
    WHERE member_row.group_id = p_group_id
      AND member_row.user_id = v_actor
      AND member_row.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active group membership required' USING ERRCODE = '42501';
  END IF;

  IF p_chapter_number IS NULL OR p_chapter_number < 0 OR p_chapter_number > 10000
    OR p_spoiler_chapter IS NULL OR p_spoiler_chapter < 0 OR p_spoiler_chapter > 10000
    OR (p_spoiler_chapter > 0 AND p_spoiler_chapter < p_chapter_number) THEN
    RAISE EXCEPTION 'Chapter and spoiler levels are invalid' USING ERRCODE = '22023';
  END IF;

  IF p_topic_type IS NULL OR p_topic_type NOT IN ('discussion', 'question', 'reflection', 'quote') THEN
    RAISE EXCEPTION 'Unsupported discussion type' USING ERRCODE = '22023';
  END IF;

  IF p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 3 AND 160
    OR p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 6000 THEN
    RAISE EXCEPTION 'Enter a title (3–160 characters) and message (1–6000 characters)' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.group_reading_books AS reading_book
    WHERE reading_book.id = p_group_reading_book_id
      AND reading_book.group_id = p_group_id
  ) THEN
    RAISE EXCEPTION 'This book is not on the group reading list' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.group_reading_discussions (
    group_id, group_reading_book_id, chapter_number, spoiler_chapter,
    topic_type, title, body, created_by
  )
  VALUES (
    p_group_id, p_group_reading_book_id, p_chapter_number, p_spoiler_chapter,
    p_topic_type, btrim(p_title), btrim(p_body), v_actor
  )
  RETURNING id INTO v_discussion_id;

  RETURN v_discussion_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_group_reading_discussion_comments(
  p_discussion_id uuid,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  discussion_id uuid,
  user_id uuid,
  body text,
  spoiler_chapter integer,
  is_unlocked boolean,
  author_name text,
  author_photo_url text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_group_id uuid;
  v_book_id uuid;
  v_discussion_author uuid;
  v_discussion_spoiler integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT discussion.group_id, reading_book.book_id,
         discussion.created_by, discussion.spoiler_chapter
    INTO v_group_id, v_book_id, v_discussion_author, v_discussion_spoiler
  FROM public.group_reading_discussions AS discussion
  JOIN public.group_reading_books AS reading_book
    ON reading_book.id = discussion.group_reading_book_id
   AND reading_book.group_id = discussion.group_id
  WHERE discussion.id = p_discussion_id;

  IF NOT FOUND OR NOT EXISTS (
    SELECT 1
    FROM public.group_chat_members AS member_row
    WHERE member_row.group_id = v_group_id
      AND member_row.user_id = v_actor
      AND member_row.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Discussion unavailable or active group membership required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    comment_row.id,
    comment_row.discussion_id,
    comment_row.user_id,
    CASE
      WHEN comment_row.user_id = v_actor
        OR (
          (
            v_discussion_author = v_actor
            OR v_discussion_spoiler = 0
            OR COALESCE(reader_progress.current_chapter, 0) >= v_discussion_spoiler
          )
          AND (
            comment_row.spoiler_chapter = 0
            OR COALESCE(reader_progress.current_chapter, 0) >= comment_row.spoiler_chapter
          )
        )
      THEN comment_row.body
      ELSE NULL
    END,
    comment_row.spoiler_chapter,
    (
      comment_row.user_id = v_actor
      OR (
        (
          v_discussion_author = v_actor
          OR v_discussion_spoiler = 0
          OR COALESCE(reader_progress.current_chapter, 0) >= v_discussion_spoiler
        )
        AND (
          comment_row.spoiler_chapter = 0
          OR COALESCE(reader_progress.current_chapter, 0) >= comment_row.spoiler_chapter
        )
      )
    ),
    COALESCE(author_profile.full_name, author_profile.name, 'Reader'),
    author_profile.profile_photo_url,
    comment_row.created_at
  FROM public.group_reading_discussion_comments AS comment_row
  JOIN public.group_reading_discussions AS parent_discussion
    ON parent_discussion.id = comment_row.discussion_id
  LEFT JOIN public.profiles AS author_profile
    ON author_profile.id = comment_row.user_id
  LEFT JOIN LATERAL (
    SELECT COALESCE(max(progress.chapter_number), 0)::integer AS current_chapter
    FROM public.detailed_reading_progress AS progress
    WHERE progress.user_id = v_actor
      AND progress.book_id = v_book_id
      AND progress.completion_percentage >= 100
  ) AS reader_progress ON true
  WHERE comment_row.discussion_id = p_discussion_id
  ORDER BY comment_row.created_at ASC, comment_row.id ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_group_reading_discussion_comment(
  p_discussion_id uuid,
  p_body text,
  p_spoiler_chapter integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_group_id uuid;
  v_book_id uuid;
  v_discussion_author uuid;
  v_discussion_spoiler integer;
  v_current_chapter integer;
  v_comment_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT discussion.group_id, reading_book.book_id,
         discussion.created_by, discussion.spoiler_chapter
    INTO v_group_id, v_book_id, v_discussion_author, v_discussion_spoiler
  FROM public.group_reading_discussions AS discussion
  JOIN public.group_reading_books AS reading_book
    ON reading_book.id = discussion.group_reading_book_id
   AND reading_book.group_id = discussion.group_id
  WHERE discussion.id = p_discussion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discussion not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.group_chat_members AS member_row
    WHERE member_row.group_id = v_group_id
      AND member_row.user_id = v_actor
      AND member_row.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active group membership required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(max(progress.chapter_number), 0)::integer
    INTO v_current_chapter
  FROM public.detailed_reading_progress AS progress
  WHERE progress.user_id = v_actor
    AND progress.book_id = v_book_id
    AND progress.completion_percentage >= 100;

  IF v_discussion_author <> v_actor
    AND v_discussion_spoiler > 0
    AND v_current_chapter < v_discussion_spoiler THEN
    RAISE EXCEPTION 'Finish the spoiler chapter before replying to this discussion' USING ERRCODE = '42501';
  END IF;

  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 2500
    OR p_spoiler_chapter IS NULL OR p_spoiler_chapter < 0 OR p_spoiler_chapter > 10000
    OR (p_spoiler_chapter > 0 AND p_spoiler_chapter < (
      SELECT discussion.chapter_number
      FROM public.group_reading_discussions AS discussion
      WHERE discussion.id = p_discussion_id
    )) THEN
    RAISE EXCEPTION 'Enter a reply (1–2500 characters) and a valid spoiler chapter' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.group_reading_discussion_comments (
    discussion_id, user_id, body, spoiler_chapter
  )
  VALUES (p_discussion_id, v_actor, btrim(p_body), p_spoiler_chapter)
  RETURNING id INTO v_comment_id;

  RETURN v_comment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_group_reading_discussion(p_discussion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.group_reading_discussions AS discussion
  WHERE discussion.id = p_discussion_id
    AND EXISTS (
      SELECT 1
      FROM public.group_chat_members AS member_row
      WHERE member_row.group_id = discussion.group_id
        AND member_row.user_id = v_actor
        AND member_row.status = 'active'
        AND (
          discussion.created_by = v_actor
          OR member_row.role IN ('owner', 'admin', 'moderator')
        )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discussion not found or permission denied' USING ERRCODE = '42501';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_group_reading_discussion_comment(p_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.group_reading_discussion_comments AS comment_row
  USING public.group_reading_discussions AS discussion
  WHERE comment_row.id = p_comment_id
    AND discussion.id = comment_row.discussion_id
    AND EXISTS (
      SELECT 1
      FROM public.group_chat_members AS member_row
      WHERE member_row.group_id = discussion.group_id
        AND member_row.user_id = v_actor
        AND member_row.status = 'active'
        AND (
          comment_row.user_id = v_actor
          OR member_row.role IN ('owner', 'admin', 'moderator')
        )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reply not found or permission denied' USING ERRCODE = '42501';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_group_reading_discussions(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_group_reading_discussion(uuid, uuid, integer, integer, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_group_reading_discussion_comments(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_group_reading_discussion_comment(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_group_reading_discussion(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_group_reading_discussion_comment(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_group_reading_discussions(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_reading_discussion(uuid, uuid, integer, integer, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_group_reading_discussion_comments(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_reading_discussion_comment(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_group_reading_discussion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_group_reading_discussion_comment(uuid) TO authenticated;

COMMENT ON TABLE public.group_reading_discussions IS
  'Group-scoped chapter discussions attached to the shared reading queue. Bodies are served only through spoiler-filtered member RPCs.';
COMMENT ON TABLE public.group_reading_discussion_comments IS
  'Replies to group reading discussions with per-reply chapter spoiler thresholds.';
