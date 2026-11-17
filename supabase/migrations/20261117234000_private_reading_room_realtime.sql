-- Restrict Realtime room topics to authenticated readers and an existing room.
-- Both the live room channel and room-list invalidation channel are private.
DROP POLICY IF EXISTS "Authenticated readers can receive reading room realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can publish reading room realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated readers can join reading room list realtime" ON realtime.messages;

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
    WHERE realtime.topic() = 'reading-room:' || room.id::text
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
    WHERE realtime.topic() = 'reading-room:' || room.id::text
  )
);

-- The list channel only carries Postgres Changes invalidations; it does not
-- publish client Broadcast or Presence payloads.
CREATE POLICY "Authenticated readers can join reading room list realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  private IS TRUE
  AND realtime.topic() LIKE 'reading-rooms-realtime:%'
);

CREATE POLICY "Authenticated readers can publish reading room list realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  private IS TRUE
  AND realtime.topic() LIKE 'reading-rooms-realtime:%'
);
