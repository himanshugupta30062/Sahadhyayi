-- Notify active members about newly scheduled group events; notify organizers about RSVPs.
CREATE OR REPLACE FUNCTION public.notify_reading_group_event_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_group uuid; v_actor uuid; v_recipient uuid; v_event uuid; v_title text; v_message text; v_link text;
BEGIN
 IF TG_TABLE_NAME='group_events' AND TG_OP='INSERT' THEN
  v_group:=NEW.group_id;v_actor:=NEW.organizer_id;v_event:=NEW.id;
  v_title:='New reading group event';v_message:=left(NEW.title,140);
  v_link:='/groups/'||v_group::text||'#group-events';
  INSERT INTO public.notifications(user_id,actor_id,type,title,message,read,entity_type,entity_id,link)
  SELECT m.user_id,v_actor,'reading_group_event',v_title,v_message,false,'group_event',v_event,v_link
  FROM public.group_chat_members m
  WHERE m.group_id=v_group AND m.status='active' AND m.user_id<>v_actor
  ON CONFLICT DO NOTHING;
 ELSIF TG_TABLE_NAME='group_event_participants' AND TG_OP='INSERT' THEN
  v_event:=NEW.event_id;v_actor:=NEW.user_id;
  SELECT e.group_id,e.organizer_id,e.title INTO v_group,v_recipient,v_title
  FROM public.group_events e WHERE e.id=v_event AND e.status='scheduled';
  IF v_recipient IS NOT NULL AND v_recipient<>v_actor THEN
   v_message:='A member responded "'||NEW.response||'" to "'||left(v_title,100)||'".';
   v_link:='/groups/'||v_group::text||'#group-events';
   INSERT INTO public.notifications(user_id,actor_id,type,title,message,read,entity_type,entity_id,link)
   VALUES(v_recipient,v_actor,'reading_group_event_rsvp','New event RSVP',v_message,false,'group_event',v_event,v_link);
  END IF;
 ELSE RETURN NEW; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_reading_group_event_activity() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS notify_reading_group_event_created ON public.group_events;
CREATE TRIGGER notify_reading_group_event_created AFTER INSERT ON public.group_events
 FOR EACH ROW EXECUTE FUNCTION public.notify_reading_group_event_activity();
DROP TRIGGER IF EXISTS notify_reading_group_event_rsvp ON public.group_event_participants;
CREATE TRIGGER notify_reading_group_event_rsvp AFTER INSERT ON public.group_event_participants
 FOR EACH ROW EXECUTE FUNCTION public.notify_reading_group_event_activity();
NOTIFY pgrst,'reload schema';
