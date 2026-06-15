
-- =========================================
-- 1. MARGIN NOTES
-- =========================================
CREATE TABLE public.margin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  page integer NOT NULL DEFAULT 1,
  quote text NOT NULL,
  note text NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','friends')),
  reactions_count integer NOT NULL DEFAULT 0,
  replies_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX margin_notes_book_idx ON public.margin_notes(book_id, created_at DESC);
CREATE INDEX margin_notes_user_idx ON public.margin_notes(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.margin_notes TO authenticated;
GRANT ALL ON public.margin_notes TO service_role;

ALTER TABLE public.margin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "margin_notes_read" ON public.margin_notes FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR public.are_friends(auth.uid(), user_id)
);
CREATE POLICY "margin_notes_insert_own" ON public.margin_notes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "margin_notes_update_own" ON public.margin_notes FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "margin_notes_delete_own" ON public.margin_notes FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER margin_notes_updated BEFORE UPDATE ON public.margin_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.margin_note_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  margin_note_id uuid NOT NULL REFERENCES public.margin_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX margin_note_replies_note_idx ON public.margin_note_replies(margin_note_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.margin_note_replies TO authenticated;
GRANT ALL ON public.margin_note_replies TO service_role;
ALTER TABLE public.margin_note_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "margin_note_replies_read" ON public.margin_note_replies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.margin_notes mn
    WHERE mn.id = margin_note_id
      AND (mn.visibility = 'public' OR mn.user_id = auth.uid() OR public.are_friends(auth.uid(), mn.user_id))
  )
);
CREATE POLICY "margin_note_replies_insert_own" ON public.margin_note_replies FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "margin_note_replies_delete_own" ON public.margin_note_replies FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TABLE public.margin_note_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  margin_note_id uuid NOT NULL REFERENCES public.margin_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (margin_note_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.margin_note_reactions TO authenticated;
GRANT ALL ON public.margin_note_reactions TO service_role;
ALTER TABLE public.margin_note_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "margin_note_reactions_read" ON public.margin_note_reactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.margin_notes mn
    WHERE mn.id = margin_note_id
      AND (mn.visibility = 'public' OR mn.user_id = auth.uid() OR public.are_friends(auth.uid(), mn.user_id))
  )
);
CREATE POLICY "margin_note_reactions_insert_own" ON public.margin_note_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "margin_note_reactions_delete_own" ON public.margin_note_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- maintain counters
CREATE OR REPLACE FUNCTION public.sync_margin_note_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'margin_note_replies' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.margin_notes SET replies_count = replies_count + 1 WHERE id = NEW.margin_note_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.margin_notes SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.margin_note_id;
      RETURN OLD;
    END IF;
  ELSIF TG_TABLE_NAME = 'margin_note_reactions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.margin_notes SET reactions_count = reactions_count + 1 WHERE id = NEW.margin_note_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.margin_notes SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = OLD.margin_note_id;
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER mn_replies_count AFTER INSERT OR DELETE ON public.margin_note_replies
FOR EACH ROW EXECUTE FUNCTION public.sync_margin_note_counts();
CREATE TRIGGER mn_reactions_count AFTER INSERT OR DELETE ON public.margin_note_reactions
FOR EACH ROW EXECUTE FUNCTION public.sync_margin_note_counts();

-- =========================================
-- 2. READING ROOMS
-- =========================================
CREATE TABLE public.reading_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL UNIQUE REFERENCES public.books_library(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reading_rooms TO authenticated;
GRANT ALL ON public.reading_rooms TO service_role;
ALTER TABLE public.reading_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_rooms_read" ON public.reading_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "reading_rooms_insert" ON public.reading_rooms FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE TABLE public.reading_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.reading_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reading_room_messages_room_idx ON public.reading_room_messages(room_id, created_at);
GRANT SELECT, INSERT ON public.reading_room_messages TO authenticated;
GRANT ALL ON public.reading_room_messages TO service_role;
ALTER TABLE public.reading_room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_room_messages_read" ON public.reading_room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "reading_room_messages_insert_own" ON public.reading_room_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.reading_room_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.reading_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('chapter_complete','joined','left')),
  chapter integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reading_room_events_room_idx ON public.reading_room_events(room_id, created_at DESC);
GRANT SELECT, INSERT ON public.reading_room_events TO authenticated;
GRANT ALL ON public.reading_room_events TO service_role;
ALTER TABLE public.reading_room_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_room_events_read" ON public.reading_room_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "reading_room_events_insert_own" ON public.reading_room_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_room_events;

-- =========================================
-- 3. SPOILER-SAFE THREADS
-- =========================================
CREATE TABLE public.spoiler_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books_library(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  min_chapter integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX spoiler_threads_book_idx ON public.spoiler_threads(book_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spoiler_threads TO authenticated;
GRANT ALL ON public.spoiler_threads TO service_role;
ALTER TABLE public.spoiler_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spoiler_threads_read" ON public.spoiler_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "spoiler_threads_insert_own" ON public.spoiler_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "spoiler_threads_update_own" ON public.spoiler_threads FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "spoiler_threads_delete_own" ON public.spoiler_threads FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER spoiler_threads_updated BEFORE UPDATE ON public.spoiler_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.spoiler_thread_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.spoiler_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  min_chapter integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX spoiler_thread_comments_thread_idx ON public.spoiler_thread_comments(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spoiler_thread_comments TO authenticated;
GRANT ALL ON public.spoiler_thread_comments TO service_role;
ALTER TABLE public.spoiler_thread_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spoiler_thread_comments_read" ON public.spoiler_thread_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "spoiler_thread_comments_insert_own" ON public.spoiler_thread_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "spoiler_thread_comments_delete_own" ON public.spoiler_thread_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.user_chapter_progress(_user uuid, _book uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(MAX(chapter_number), 0)::integer
  FROM public.detailed_reading_progress
  WHERE user_id = _user AND book_id = _book AND completion_percentage >= 100;
$$;

CREATE VIEW public.spoiler_threads_safe
WITH (security_invoker = on)
AS
SELECT
  t.id, t.book_id, t.user_id, t.title, t.min_chapter, t.created_at, t.updated_at,
  CASE
    WHEN public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter THEN t.body
    ELSE NULL
  END AS body,
  (public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter) AS is_unlocked
FROM public.spoiler_threads t;

GRANT SELECT ON public.spoiler_threads_safe TO authenticated;

-- =========================================
-- 4. READING DNA
-- =========================================
CREATE TABLE public.reading_dna (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  genres jsonb NOT NULL DEFAULT '[]'::jsonb,
  moods jsonb NOT NULL DEFAULT '[]'::jsonb,
  pace text,
  themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  signature_color text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reading_dna TO authenticated;
GRANT ALL ON public.reading_dna TO service_role;
ALTER TABLE public.reading_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_dna_read" ON public.reading_dna FOR SELECT TO authenticated USING (true);
CREATE POLICY "reading_dna_upsert_own" ON public.reading_dna FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reading_dna_update_own" ON public.reading_dna FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER reading_dna_updated BEFORE UPDATE ON public.reading_dna
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
