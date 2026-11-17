-- Reading rooms are intentionally open to authenticated readers, but the
-- underlying grants should match the client operations the feature actually uses.
-- Remove inherited/default broad grants from anonymous and authenticated roles.
REVOKE ALL PRIVILEGES ON TABLE
  public.reading_rooms,
  public.reading_room_messages,
  public.reading_room_events
FROM PUBLIC, anon, authenticated;

-- Signed-in readers can discover/create rooms. Room creators can update their
-- room metadata; the hook uses an upsert keyed by book_id.
GRANT SELECT, INSERT, UPDATE ON TABLE public.reading_rooms TO authenticated;

DROP POLICY IF EXISTS "reading_rooms_creator_update" ON public.reading_rooms;
CREATE POLICY "reading_rooms_creator_update"
ON public.reading_rooms
FOR UPDATE
TO authenticated
USING (created_by = (SELECT auth.uid()))
WITH CHECK (created_by = (SELECT auth.uid()));

-- Chat and chapter activity are append-only from the client. No client-side
-- UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER privileges are required.
GRANT SELECT, INSERT ON TABLE
  public.reading_room_messages,
  public.reading_room_events
TO authenticated;

-- Preserve the current open-room product model: authenticated users can read
-- all room messages/events and may only insert rows under their own user ID.
-- The existing SELECT/INSERT RLS policies remain in force.
NOTIFY pgrst, 'reload schema';
