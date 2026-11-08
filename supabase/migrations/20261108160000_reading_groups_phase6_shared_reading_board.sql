-- Reading Groups Phase 6: shared reading board and opt-in member progress.
-- All reads and writes use narrowly scoped RPCs. Raw progress rows are never
-- directly selectable by clients, and only explicitly shared aggregates are returned.

CREATE TABLE IF NOT EXISTS public.group_reading_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'up_next'
    CHECK (status IN ('current', 'up_next', 'completed', 'archived')),
  target_date date,
  started_at date,
  completed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_reading_books_group_book_unique UNIQUE (group_id, book_id)
);

-- A group has at most one selected shared read at a time.
CREATE UNIQUE INDEX IF NOT EXISTS group_reading_books_one_current_idx
  ON public.group_reading_books (group_id)
  WHERE status = 'current';

CREATE INDEX IF NOT EXISTS group_reading_books_group_status_created_idx
  ON public.group_reading_books (group_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.group_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_reading_book_id uuid NOT NULL
    REFERENCES public.group_reading_books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_page integer NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  is_shared boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_reading_progress_member_unique UNIQUE (group_reading_book_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_reading_progress_book_shared_idx
  ON public.group_reading_progress (group_reading_book_id, is_shared)
  WHERE is_shared = true;

ALTER TABLE public.group_reading_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reading_progress ENABLE ROW LEVEL SECURITY;

-- Clients must use the authorized functions below. In particular, no client
-- can enumerate private progress rows or set another member's user_id.
REVOKE ALL ON TABLE public.group_reading_books FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.group_reading_progress FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_reading_group_books(p_group_id uuid)
RETURNS TABLE (
  id uuid,
  group_id uuid,
  book_id uuid,
  status text,
  target_date date,
  started_at date,
  completed_at date,
  created_at timestamptz,
  title text,
  author text,
  cover_image_url text,
  pages integer,
  my_current_page integer,
  my_is_shared boolean,
  shared_reader_count integer,
  average_progress numeric
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
    reading_book.id,
    reading_book.group_id,
    reading_book.book_id,
    reading_book.status,
    reading_book.target_date,
    reading_book.started_at,
    reading_book.completed_at,
    reading_book.created_at,
    book.title,
    book.author,
    book.cover_image_url,
    book.pages,
    COALESCE(my_progress.current_page, 0)::integer,
    COALESCE(my_progress.is_shared, false),
    COALESCE(shared_progress.shared_reader_count, 0)::integer,
    shared_progress.average_progress
  FROM public.group_reading_books AS reading_book
  JOIN public.books_library AS book ON book.id = reading_book.book_id
  LEFT JOIN public.group_reading_progress AS my_progress
    ON my_progress.group_reading_book_id = reading_book.id
    AND my_progress.user_id = v_actor
  LEFT JOIN LATERAL (
    SELECT
      count(*) FILTER (WHERE progress.is_shared)::integer AS shared_reader_count,
      round(
        avg(LEAST(100, (progress.current_page::numeric / NULLIF(book.pages, 0)) * 100))
          FILTER (WHERE progress.is_shared),
        1
      ) AS average_progress
    FROM public.group_reading_progress AS progress
    WHERE progress.group_reading_book_id = reading_book.id
  ) AS shared_progress ON true
  WHERE reading_book.group_id = p_group_id
  ORDER BY
    CASE reading_book.status
      WHEN 'current' THEN 0
      WHEN 'up_next' THEN 1
      WHEN 'completed' THEN 2
      ELSE 3
    END,
    reading_book.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_reading_group_book(
  p_group_id uuid,
  p_book_id uuid,
  p_target_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
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
      AND member_row.role IN ('owner', 'admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Only active group moderators can manage the reading list' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.books_library AS book WHERE book.id = p_book_id) THEN
    RAISE EXCEPTION 'Book not found in the library' USING ERRCODE = 'P0002';
  END IF;

  IF p_target_date IS NOT NULL AND p_target_date > current_date + 730 THEN
    RAISE EXCEPTION 'Target date must be within the next two years' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.group_reading_books (group_id, book_id, added_by, status, target_date)
  VALUES (p_group_id, p_book_id, v_actor, 'up_next', p_target_date)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_reading_group_book_status(
  p_group_reading_book_id uuid,
  p_status text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_group_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('current', 'up_next', 'completed', 'archived') THEN
    RAISE EXCEPTION 'Unsupported reading-list status' USING ERRCODE = '22023';
  END IF;

  SELECT reading_book.group_id INTO v_group_id
  FROM public.group_reading_books AS reading_book
  JOIN public.group_chat_members AS member_row
    ON member_row.group_id = reading_book.group_id
    AND member_row.user_id = v_actor
    AND member_row.status = 'active'
    AND member_row.role IN ('owner', 'admin', 'moderator')
  WHERE reading_book.id = p_group_reading_book_id
  FOR UPDATE OF reading_book;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reading-list entry not found or permission denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.group_reading_books
  SET status = p_status,
      started_at = CASE
        WHEN p_status IN ('current', 'completed') THEN COALESCE(started_at, current_date)
        ELSE started_at
      END,
      completed_at = CASE
        WHEN p_status = 'completed' THEN current_date
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_group_reading_book_id;

  RETURN p_status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_reading_group_book(p_group_reading_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_group_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT reading_book.group_id INTO v_group_id
  FROM public.group_reading_books AS reading_book
  JOIN public.group_chat_members AS member_row
    ON member_row.group_id = reading_book.group_id
    AND member_row.user_id = v_actor
    AND member_row.status = 'active'
    AND member_row.role IN ('owner', 'admin', 'moderator')
  WHERE reading_book.id = p_group_reading_book_id
  FOR UPDATE OF reading_book;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reading-list entry not found or permission denied' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.group_reading_books WHERE id = p_group_reading_book_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_reading_group_progress(
  p_group_reading_book_id uuid,
  p_current_page integer,
  p_is_shared boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_group_id uuid;
  v_total_pages integer;
  v_progress_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_current_page IS NULL OR p_current_page < 0 THEN
    RAISE EXCEPTION 'Page number must be zero or greater' USING ERRCODE = '22023';
  END IF;

  SELECT reading_book.group_id, book.pages
  INTO v_group_id, v_total_pages
  FROM public.group_reading_books AS reading_book
  JOIN public.books_library AS book ON book.id = reading_book.book_id
  JOIN public.group_chat_members AS member_row
    ON member_row.group_id = reading_book.group_id
    AND member_row.user_id = v_actor
    AND member_row.status = 'active'
  WHERE reading_book.id = p_group_reading_book_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reading-list entry unavailable or active group membership required' USING ERRCODE = '42501';
  END IF;

  IF v_total_pages IS NOT NULL AND p_current_page > v_total_pages THEN
    RAISE EXCEPTION 'Page number cannot exceed the book page count' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.group_reading_progress (
    group_reading_book_id, user_id, current_page, is_shared, updated_at
  )
  VALUES (
    p_group_reading_book_id, v_actor, p_current_page, COALESCE(p_is_shared, false), now()
  )
  ON CONFLICT (group_reading_book_id, user_id)
  DO UPDATE SET
    current_page = EXCLUDED.current_page,
    is_shared = EXCLUDED.is_shared,
    updated_at = now()
  RETURNING id INTO v_progress_id;

  RETURN v_progress_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.list_reading_group_books(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_reading_group_book(uuid, uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_reading_group_book_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_reading_group_book(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_reading_group_progress(uuid, integer, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_reading_group_books(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_reading_group_book(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_reading_group_book_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_reading_group_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_reading_group_progress(uuid, integer, boolean) TO authenticated;

COMMENT ON TABLE public.group_reading_books IS
  'Shared reading queue and current title for a reading group; all access is mediated by group-scoped RPCs.';
COMMENT ON TABLE public.group_reading_progress IS
  'Per-member pages read for a shared group title; group-visible only when the member opts in.';
