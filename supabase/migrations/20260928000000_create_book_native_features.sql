-- Migration: 20260928000000_create_book_native_features.sql
-- Create schema, RLS policies, and views for Book-Native Social Features:
-- 1. Margin Notes (notes, replies, reactions)
-- 2. Reading Rooms (rooms, messages, events)
-- 3. Chapter Spoiler-Safe Threads (threads, comments, safe view, progress RPC)
-- 4. Reading DNA (taste fingerprint profile)
-- 5. Rate limit utility RPC if not present

-- -----------------------------------------------------------------------------
-- 1. MARGIN NOTES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.margin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page INTEGER NOT NULL DEFAULT 1,
  quote TEXT NOT NULL,
  note TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends')),
  reactions_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_margin_notes_book ON public.margin_notes(book_id);
CREATE INDEX IF NOT EXISTS idx_margin_notes_user ON public.margin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_margin_notes_created ON public.margin_notes(created_at DESC);

ALTER TABLE public.margin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Margin notes are viewable by public or friends" ON public.margin_notes;
CREATE POLICY "Margin notes are viewable by public or friends"
  ON public.margin_notes
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friends
        WHERE (user1_id = auth.uid() AND user2_id = margin_notes.user_id)
           OR (user2_id = auth.uid() AND user1_id = margin_notes.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create margin notes" ON public.margin_notes;
CREATE POLICY "Authenticated users can create margin notes"
  ON public.margin_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own margin notes" ON public.margin_notes;
CREATE POLICY "Users can update their own margin notes"
  ON public.margin_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own margin notes" ON public.margin_notes;
CREATE POLICY "Users can delete their own margin notes"
  ON public.margin_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Replies
CREATE TABLE IF NOT EXISTS public.margin_note_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  margin_note_id UUID NOT NULL REFERENCES public.margin_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_margin_note_replies_note ON public.margin_note_replies(margin_note_id);

ALTER TABLE public.margin_note_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Margin note replies are viewable if parent is viewable" ON public.margin_note_replies;
CREATE POLICY "Margin note replies are viewable if parent is viewable"
  ON public.margin_note_replies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.margin_notes
      WHERE margin_notes.id = margin_note_replies.margin_note_id
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create margin note replies" ON public.margin_note_replies;
CREATE POLICY "Authenticated users can create margin note replies"
  ON public.margin_note_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own margin note replies" ON public.margin_note_replies;
CREATE POLICY "Users can delete their own margin note replies"
  ON public.margin_note_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reactions
CREATE TABLE IF NOT EXISTS public.margin_note_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  margin_note_id UUID NOT NULL REFERENCES public.margin_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_margin_note_reaction UNIQUE (margin_note_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_margin_note_reactions_note ON public.margin_note_reactions(margin_note_id);

ALTER TABLE public.margin_note_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Margin note reactions are viewable" ON public.margin_note_reactions;
CREATE POLICY "Margin note reactions are viewable"
  ON public.margin_note_reactions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public.margin_note_reactions;
CREATE POLICY "Authenticated users can add reactions"
  ON public.margin_note_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.margin_note_reactions;
CREATE POLICY "Users can remove their own reactions"
  ON public.margin_note_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for counts
CREATE OR REPLACE FUNCTION public.handle_margin_note_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_TABLE_NAME = 'margin_note_replies' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.margin_notes SET replies_count = replies_count + 1 WHERE id = NEW.margin_note_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.margin_notes SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.margin_note_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'margin_note_reactions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.margin_notes SET reactions_count = reactions_count + 1 WHERE id = NEW.margin_note_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.margin_notes SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = OLD.margin_note_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_margin_note_replies_count ON public.margin_note_replies;
CREATE TRIGGER trg_margin_note_replies_count
  AFTER INSERT OR DELETE ON public.margin_note_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_margin_note_counts();

DROP TRIGGER IF EXISTS trg_margin_note_reactions_count ON public.margin_note_reactions;
CREATE TRIGGER trg_margin_note_reactions_count
  AFTER INSERT OR DELETE ON public.margin_note_reactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_margin_note_counts();


-- -----------------------------------------------------------------------------
-- 2. READING ROOMS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reading_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_reading_rooms_book UNIQUE (book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_rooms_created ON public.reading_rooms(created_at DESC);

ALTER TABLE public.reading_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reading rooms are readable by all authenticated readers" ON public.reading_rooms;
CREATE POLICY "Reading rooms are readable by all authenticated readers"
  ON public.reading_rooms
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated readers can create reading rooms" ON public.reading_rooms;
CREATE POLICY "Authenticated readers can create reading rooms"
  ON public.reading_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creators can update their reading rooms" ON public.reading_rooms;
CREATE POLICY "Creators can update their reading rooms"
  ON public.reading_rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Room Messages
CREATE TABLE IF NOT EXISTS public.reading_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.reading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reading_room_messages_room ON public.reading_room_messages(room_id, created_at ASC);

ALTER TABLE public.reading_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room messages are readable by authenticated users" ON public.reading_room_messages;
CREATE POLICY "Room messages are readable by authenticated users"
  ON public.reading_room_messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can send room messages" ON public.reading_room_messages;
CREATE POLICY "Authenticated users can send room messages"
  ON public.reading_room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Room Events
CREATE TABLE IF NOT EXISTS public.reading_room_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.reading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('chapter_complete', 'joined', 'left')),
  chapter INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reading_room_events_room ON public.reading_room_events(room_id, created_at DESC);

ALTER TABLE public.reading_room_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room events are readable by authenticated users" ON public.reading_room_events;
CREATE POLICY "Room events are readable by authenticated users"
  ON public.reading_room_events
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can record room events" ON public.reading_room_events;
CREATE POLICY "Authenticated users can record room events"
  ON public.reading_room_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 3. CHAPTER SPOILER-SAFE THREADS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.spoiler_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  min_chapter INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spoiler_threads_book ON public.spoiler_threads(book_id);
CREATE INDEX IF NOT EXISTS idx_spoiler_threads_created ON public.spoiler_threads(created_at DESC);

ALTER TABLE public.spoiler_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spoiler threads readable by authenticated" ON public.spoiler_threads;
CREATE POLICY "Spoiler threads readable by authenticated"
  ON public.spoiler_threads
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create spoiler threads" ON public.spoiler_threads;
CREATE POLICY "Authenticated users can create spoiler threads"
  ON public.spoiler_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can update their spoiler threads" ON public.spoiler_threads;
CREATE POLICY "Authors can update their spoiler threads"
  ON public.spoiler_threads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can delete their spoiler threads" ON public.spoiler_threads;
CREATE POLICY "Authors can delete their spoiler threads"
  ON public.spoiler_threads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Spoiler Thread Comments
CREATE TABLE IF NOT EXISTS public.spoiler_thread_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.spoiler_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  min_chapter INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spoiler_comments_thread ON public.spoiler_thread_comments(thread_id, created_at ASC);

ALTER TABLE public.spoiler_thread_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spoiler thread comments readable by authenticated" ON public.spoiler_thread_comments;
CREATE POLICY "Spoiler thread comments readable by authenticated"
  ON public.spoiler_thread_comments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment on spoiler threads" ON public.spoiler_thread_comments;
CREATE POLICY "Authenticated users can comment on spoiler threads"
  ON public.spoiler_thread_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Chapter Progress helper function
CREATE OR REPLACE FUNCTION public.user_chapter_progress(_user uuid, _book uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(chapter_number), 0)
  FROM public.detailed_reading_progress
  WHERE user_id = _user
    AND book_id = _book
    AND completion_percentage >= 100;
$$;

-- View for safe spoiler thread display
CREATE OR REPLACE VIEW public.spoiler_threads_safe AS
SELECT
  t.id,
  t.book_id,
  t.user_id,
  t.title,
  CASE
    WHEN (auth.uid() = t.user_id OR public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter)
    THEN t.body
    ELSE NULL
  END AS body,
  t.min_chapter,
  CASE
    WHEN (auth.uid() = t.user_id OR public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter)
    THEN true
    ELSE false
  END AS is_unlocked,
  t.created_at,
  t.updated_at
FROM public.spoiler_threads t;


-- -----------------------------------------------------------------------------
-- 4. READING DNA
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reading_dna (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  genres JSONB NOT NULL DEFAULT '[]'::jsonb,
  moods JSONB NOT NULL DEFAULT '[]'::jsonb,
  pace TEXT,
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  signature_color TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reading DNA is viewable by all authenticated users" ON public.reading_dna;
CREATE POLICY "Reading DNA is viewable by all authenticated users"
  ON public.reading_dna
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert or update their own reading DNA" ON public.reading_dna;
CREATE POLICY "Users can insert or update their own reading DNA"
  ON public.reading_dna
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reading DNA" ON public.reading_dna;
CREATE POLICY "Users can update their reading DNA"
  ON public.reading_dna
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 5. RATE LIMIT RPC (if not exists)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits ON public.api_rate_limits(identifier, endpoint, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INT,
  p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.api_rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND created_at > (now() - (p_window_minutes || ' minutes')::interval);

  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.api_rate_limits (identifier, endpoint)
  VALUES (p_identifier, p_endpoint);

  RETURN TRUE;
END;
$$;

NOTIFY pgrst, 'reload schema';
