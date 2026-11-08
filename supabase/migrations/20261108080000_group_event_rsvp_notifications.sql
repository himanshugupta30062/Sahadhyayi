-- Notify event organizer when another member changes RSVP.
-- Reminder scheduling is intentionally separate: it requires a configured scheduler,
-- user timezone/preferences and delivery deduplication before sending.
CREATE OR REPLACE FUNCTION public.notify_group_event_rsvp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_event record;
  v_actor_name text;
  v_status text;
  v_link text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT e.id, e.title, e.group_id, e.organizer_id, e.status
    INTO v_event
  FROM public.group_events e
  WHERE e.id = NEW.event_id;

  IF NOT FOUND OR v_event.status <> 'scheduled'
     OR v_event.organizer_id IS NULL
     OR v_event.organizer_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_status := CASE NEW.status
    WHEN 'going' THEN 'is going'
    WHEN 'maybe' THEN 'may attend'
    WHEN 'declined' THEN 'declined'
    ELSE 'updated their RSVP'
  END;

  SELECT COALESCE(p.full_name, p.username, 'A group member')
    INTO v_actor_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  v_link := '/groups/' || v_event.group_id::text;

  INSERT INTO public.notifications
    (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
  VALUES
    (v_event.organizer_id, NEW.user_id, 'group_event_rsvp',
     'Event RSVP updated',
     COALESCE(v_actor_name, 'A group member') || ' ' || v_status || ' "' || v_event.title || '".',
     false, 'group_event', v_event.id, v_link);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_group_event_rsvp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_group_event_rsvp ON public.group_event_participants;
CREATE TRIGGER notify_group_event_rsvp
  AFTER INSERT OR UPDATE OF status ON public.group_event_participants
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_event_rsvp();

NOTIFY pgrst, 'reload schema';
