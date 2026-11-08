-- Reading Groups Phase 4: group events and RSVP foundation.
-- Events are scoped to a group; visibility is inherited from group membership.
-- All RSVP/capacity changes run transactionally through SECURITY DEFINER RPCs.

CREATE TABLE IF NOT EXISTS public.group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 120),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  event_type text NOT NULL CHECK (event_type IN ('book_discussion','co_reading','reading_marathon','author_meetup','weekly_session','other')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  location text CHECK (location IS NULL OR length(location) <= 240),
  reading_session_id uuid,
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  capacity integer CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 10000),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (starts_at > created_at - interval '1 day')
);

CREATE INDEX IF NOT EXISTS group_events_group_starts_idx
  ON public.group_events(group_id, starts_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS group_events_organizer_idx ON public.group_events(organizer_id);

CREATE TABLE IF NOT EXISTS public.group_event_participants (
  event_id uuid NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response text NOT NULL DEFAULT 'going' CHECK (response IN ('going','maybe')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(event_id,user_id)
);
CREATE INDEX IF NOT EXISTS group_event_participants_user_idx ON public.group_event_participants(user_id,event_id);

ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_events_member_read ON public.group_events;
CREATE POLICY group_events_member_read ON public.group_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.group_chat_members m
      WHERE m.group_id = group_events.group_id AND m.user_id = auth.uid() AND m.status = 'active')
  );

DROP POLICY IF EXISTS group_event_participants_member_read ON public.group_event_participants;
CREATE POLICY group_event_participants_member_read ON public.group_event_participants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.group_events e
      JOIN public.group_chat_members m ON m.group_id=e.group_id
      WHERE e.id=group_event_participants.event_id AND m.user_id=auth.uid() AND m.status='active')
  );

REVOKE INSERT, UPDATE, DELETE ON public.group_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.group_event_participants FROM anon, authenticated;
GRANT SELECT ON public.group_events, public.group_event_participants TO authenticated;

CREATE OR REPLACE FUNCTION public.create_reading_group_event(
  p_group_id uuid, p_title text, p_description text, p_event_type text,
  p_starts_at timestamptz, p_ends_at timestamptz, p_timezone text DEFAULT 'Asia/Kolkata',
  p_location text DEFAULT NULL, p_capacity integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_actor uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.group_chat_members
    WHERE group_id=p_group_id AND user_id=v_actor AND status='active') THEN
    RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
  END IF;
  IF p_starts_at <= now() OR p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Event must have a future start and end after start' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.group_events(group_id,title,description,event_type,starts_at,ends_at,timezone,location,organizer_id,capacity)
  VALUES(p_group_id,btrim(p_title),nullif(btrim(p_description),''),p_event_type,p_starts_at,p_ends_at,
    coalesce(nullif(btrim(p_timezone),''),'Asia/Kolkata'),nullif(btrim(p_location),''),v_actor,p_capacity)
  RETURNING id INTO v_id;
  INSERT INTO public.group_event_participants(event_id,user_id,response) VALUES(v_id,v_actor,'going');
  RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_reading_group_event(uuid,text,text,text,timestamptz,timestamptz,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_reading_group_event(uuid,text,text,text,timestamptz,timestamptz,text,text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_reading_group_event(p_event_id uuid,p_response text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_actor uuid := auth.uid(); v_event public.group_events; v_count integer;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  IF p_response NOT IN ('going','maybe','decline') THEN RAISE EXCEPTION 'Invalid RSVP response' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_event FROM public.group_events WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.status <> 'scheduled' THEN RAISE EXCEPTION 'Event is unavailable' USING ERRCODE='P0002'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.group_chat_members WHERE group_id=v_event.group_id AND user_id=v_actor AND status='active') THEN
    RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
  END IF;
  IF p_response='decline' THEN
    DELETE FROM public.group_event_participants WHERE event_id=p_event_id AND user_id=v_actor;
    RETURN 'declined';
  END IF;
  IF p_response='going' AND v_event.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.group_event_participants WHERE event_id=p_event_id AND response='going' AND user_id<>v_actor;
    IF v_count >= v_event.capacity THEN RAISE EXCEPTION 'Event is full' USING ERRCODE='P0001'; END IF;
  END IF;
  INSERT INTO public.group_event_participants(event_id,user_id,response)
  VALUES(p_event_id,v_actor,p_response)
  ON CONFLICT(event_id,user_id) DO UPDATE SET response=excluded.response,updated_at=now();
  RETURN p_response;
END;
$function$;
REVOKE ALL ON FUNCTION public.respond_to_reading_group_event(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.respond_to_reading_group_event(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_reading_group_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_actor uuid := auth.uid(); v_event public.group_events;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  SELECT * INTO v_event FROM public.group_events WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found' USING ERRCODE='P0002'; END IF;
  IF v_event.organizer_id<>v_actor AND NOT EXISTS (SELECT 1 FROM public.group_chat_members
    WHERE group_id=v_event.group_id AND user_id=v_actor AND status='active' AND role IN ('owner','admin')) THEN
    RAISE EXCEPTION 'Organizer or group admin permission required' USING ERRCODE='42501';
  END IF;
  UPDATE public.group_events SET status='cancelled',updated_at=now() WHERE id=p_event_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.cancel_reading_group_event(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancel_reading_group_event(uuid) TO authenticated;

COMMENT ON TABLE public.group_events IS 'Scheduled reading-group activities; group membership gates access.';
COMMENT ON TABLE public.group_event_participants IS 'RSVPs for group events. Mutations are performed through RSVP RPC.';
