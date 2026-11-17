-- Restrict Realtime room topics to authenticated readers and an existing room.
-- Both the live room channel and room-list invalidation channel are private.
-- Drop every managed policy first so this migration is safe to replay if a
-- deployment was applied manually but its migration version was not recorded.
DROP POLICY IF EXISTS "Authenticated readers can receive reading room realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can publish reading room realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can join reading room list realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can publish reading room list realtime" ON realtime.messages;

CREATE POLICY "Authenticated readers can receive reading room realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  private IS TRUE
  AND extension IN ('broadcast', 'presence')
  AND EXISTS (
    SELECT 1
    FROM public.reading_rooms AS room
    WHERE (SELECT realtime.topic()) = 'reading-room:' || room.id::text
  )
);

CREATE POLICY "Authenticated readers can publish reading room realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  private IS TRUE
  AND extension IN ('broadcast', 'presence')
  AND EXISTS (
    SELECT 1
    FROM public.reading_rooms AS room
    WHERE (SELECT realtime.topic()) = 'reading-room:' || room.id::text
  )
);

-- The list channel is used only for Postgres Changes invalidation. It must
-- be joinable as a private channel, but clients must not be able to publish
-- Broadcast or Presence messages on this shared topic.
CREATE POLICY "Authenticated readers can join reading room list realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  private IS TRUE
  AND extension IN ('broadcast', 'presence')
  AND (SELECT realtime.topic()) LIKE 'reading-rooms-realtime:%'
);
