-- Repair event notification trigger migration syntax and preserve preference/mute checks.
CREATE OR REPLACE FUNCTION public.notify_reading_group_event_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status <> 'scheduled' THEN RETURN NEW; END IF;
  INSERT INTO public.notifications
    (user_id, author_id, actor_id, type, title, message, read, entity_type, entity_id, link)
  SELECT member.user_id, NEW.organizer_id, NEW.organizer_id,
    'reading_group_event', 'New reading group event', NEW.title, false,
    'group_event', NEW.id, '/groups/' || NEW.group_id::text
  FROM public.group_chat_members member
  LEFT JOIN public.reading_group_notification_preferences pref ON pref.user_id=member.user_id
  LEFT JOIN public.reading_group_notification_mutes mute ON mute.user_id=member.user_id AND mute.group_id=NEW.group_id
  WHERE member.group_id=NEW.group_id AND member.status='active'
    AND member.user_id<>NEW.organizer_id
    AND coalesce(pref.enabled,true) AND coalesce(pref.membership_activity,true)
    AND (mute.user_id IS NULL OR (mute.muted_until IS NOT NULL AND mute.muted_until<=now()));
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.notify_reading_group_event_created() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS notify_reading_group_event_created ON public.group_events;
CREATE TRIGGER notify_reading_group_event_created AFTER INSERT ON public.group_events
FOR EACH ROW EXECUTE FUNCTION public.notify_reading_group_event_created();
