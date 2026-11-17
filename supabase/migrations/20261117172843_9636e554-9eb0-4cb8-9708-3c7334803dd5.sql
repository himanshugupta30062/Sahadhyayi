-- Reading room access is member-based. Directory RPC exposes only room/book metadata;
-- underlying room, chat, activity, and live channels require membership.

CREATE TABLE public.reading_room_members (
  room_id uuid NOT NULL REFERENCES public.reading_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.reading_room_members TO authenticated;
GRANT ALL ON public.reading_room_members TO service_role;
ALTER TABLE public.reading_room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readers can view their own room memberships"
  ON public.reading_room_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Readers can join rooms as themselves"
  ON public.reading_room_members FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Readers can leave their own rooms"
  ON public.reading_room_members FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.is_reading_room_member(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.reading_room_members AS member
    WHERE member.room_id = p_room_id AND member.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_reading_room_member(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_reading_room_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_reading_room_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.reading_room_members (room_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.add_reading_room_creator_as_member() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS add_reading_room_creator_as_member ON public.reading_rooms;
CREATE TRIGGER add_reading_room_creator_as_member
  AFTER INSERT ON public.reading_rooms
  FOR EACH ROW EXECUTE FUNCTION public.add_reading_room_creator_as_member();

INSERT INTO public.reading_room_members (room_id, user_id)
SELECT id, created_by FROM public.reading_rooms
ON CONFLICT (room_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_reading_rooms()
RETURNS TABLE (
  id uuid,
  book_id uuid,
  name text,
  created_at timestamptz,
  book_title text,
  book_author text,
  cover_image_url text,
  is_member boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to browse reading rooms' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT room.id, room.book_id, room.name, room.created_at,
         book.title, book.author, book.cover_image_url,
         public.is_reading_room_member(room.id)
  FROM public.reading_rooms AS room
  LEFT JOIN public.books_library AS book ON book.id = room.book_id
  ORDER BY room.created_at DESC
  LIMIT 100;
END;
$$;
REVOKE ALL ON FUNCTION public.get_reading_rooms() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reading_rooms() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_reading_room(p_book_id uuid, p_name text)
RETURNS public.reading_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.reading_rooms;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_name IS NULL OR length(btrim(p_name)) = 0 OR length(btrim(p_name)) > 160 THEN
    RAISE EXCEPTION 'Room name must contain 1-160 characters' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.reading_rooms (book_id, name, created_by)
  VALUES (p_book_id, btrim(p_name), v_user_id)
  ON CONFLICT (book_id) DO UPDATE SET name = EXCLUDED.name
    WHERE public.reading_rooms.created_by = v_user_id
  RETURNING * INTO v_room;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A room for this book already exists. Join it from the room list.' USING ERRCODE = '23505';
  END IF;
  RETURN v_room;
END;
$$;
REVOKE ALL ON FUNCTION public.create_reading_room(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reading_room(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "reading_rooms_read" ON public.reading_rooms;
DROP POLICY IF EXISTS "Reading rooms are readable by all authenticated readers" ON public.reading_rooms;
CREATE POLICY "reading_rooms_members_read"
  ON public.reading_rooms FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()) OR public.is_reading_room_member(id));

DROP POLICY IF EXISTS "reading_room_messages_read" ON public.reading_room_messages;
DROP POLICY IF EXISTS "Room messages are readable by authenticated users" ON public.reading_room_messages;
CREATE POLICY "reading_room_messages_members_read"
  ON public.reading_room_messages FOR SELECT TO authenticated
  USING (public.is_reading_room_member(room_id));
DROP POLICY IF EXISTS "reading_room_messages_insert_own" ON public.reading_room_messages;
DROP POLICY IF EXISTS "Authenticated users can send room messages" ON public.reading_room_messages;
CREATE POLICY "reading_room_messages_members_insert_own"
  ON public.reading_room_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_reading_room_member(room_id));

DROP POLICY IF EXISTS "reading_room_events_read" ON public.reading_room_events;
DROP POLICY IF EXISTS "Room events are readable by authenticated users" ON public.reading_room_events;
CREATE POLICY "reading_room_events_members_read"
  ON public.reading_room_events FOR SELECT TO authenticated
  USING (public.is_reading_room_member(room_id));
DROP POLICY IF EXISTS "reading_room_events_insert_own" ON public.reading_room_events;
DROP POLICY IF EXISTS "Authenticated users can record room events" ON public.reading_room_events;
CREATE POLICY "reading_room_events_members_insert_own"
  ON public.reading_room_events FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_reading_room_member(room_id));

-- Private room broadcast/presence topics must also belong to room members.
DROP POLICY IF EXISTS "Authenticated readers can receive reading room realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can publish reading room realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can join reading room list realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can publish reading room list realtime" ON realtime.messages;
CREATE POLICY "Room members can receive reading room realtime"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    private IS TRUE AND extension IN ('broadcast', 'presence')
    AND EXISTS (
      SELECT 1 FROM public.reading_rooms AS room
      WHERE (SELECT realtime.topic()) = 'reading-room:' || room.id::text
        AND public.is_reading_room_member(room.id)
    )
  );
CREATE POLICY "Room members can publish reading room realtime"
  ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (
    private IS TRUE AND extension IN ('broadcast', 'presence')
    AND EXISTS (
      SELECT 1 FROM public.reading_rooms AS room
      WHERE (SELECT realtime.topic()) = 'reading-room:' || room.id::text
        AND public.is_reading_room_member(room.id)
    )
  );
CREATE POLICY "Authenticated readers can join reading room list realtime"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    private IS TRUE AND extension IN ('broadcast', 'presence')
    AND (SELECT realtime.topic()) LIKE 'reading-rooms-realtime:%'
  );

NOTIFY pgrst, 'reload schema';