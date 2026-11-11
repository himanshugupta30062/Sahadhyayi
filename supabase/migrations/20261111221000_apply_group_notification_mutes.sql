-- Apply per-group mute settings to existing notification trigger pipelines.
CREATE OR REPLACE FUNCTION public.notify_reading_group_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_group uuid; v_actor uuid; v_post uuid; v_body text; v_type text; v_title text; v_message text; v_link text;
BEGIN
 IF TG_TABLE_NAME='reading_group_posts' AND TG_OP='INSERT' THEN
  v_group:=NEW.group_id;v_actor:=NEW.author_id;v_post:=NEW.id;v_body:=NEW.body;
  v_type:='reading_group_post';v_title:='New group post';v_message:=left(v_body,140);v_link:='/groups/'||v_group::text||'#group-feed';
 ELSIF TG_TABLE_NAME='reading_group_post_comments' AND TG_OP='INSERT' THEN
  v_post:=NEW.post_id;v_actor:=NEW.author_id;v_body:=NEW.body;
  SELECT p.group_id INTO v_group FROM public.reading_group_posts p WHERE p.id=v_post;
  v_type:='reading_group_reply';v_title:='New group reply';v_message:=left(v_body,140);v_link:='/groups/'||v_group::text||'#group-feed';
 ELSE RETURN NEW; END IF;
 INSERT INTO public.notifications(user_id,actor_id,type,title,message,read,entity_type,entity_id,link)
 SELECT m.user_id,v_actor,v_type,v_title,v_message,false,'reading_group_post',v_post,v_link
 FROM public.group_chat_members m
 WHERE m.group_id=v_group AND m.status='active' AND m.user_id<>v_actor
 AND NOT public.reading_group_notifications_muted(m.user_id,v_group)
 ON CONFLICT DO NOTHING;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.notify_reading_group_event_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_group uuid; v_actor uuid; v_recipient uuid; v_event uuid; v_title text; v_message text; v_link text;
BEGIN
 IF TG_TABLE_NAME='group_events' AND TG_OP='INSERT' THEN
  v_group:=NEW.group_id;v_actor:=NEW.organizer_id;v_event:=NEW.id;v_title:='New reading group event';v_message:=left(NEW.title,140);v_link:='/groups/'||v_group::text||'#group-events';
  INSERT INTO public.notifications(user_id,actor_id,type,title,message,read,entity_type,entity_id,link)
  SELECT m.user_id,v_actor,'reading_group_event',v_title,v_message,false,'group_event',v_event,v_link
  FROM public.group_chat_members m WHERE m.group_id=v_group AND m.status='active' AND m.user_id<>v_actor
  AND NOT public.reading_group_notifications_muted(m.user_id,v_group) ON CONFLICT DO NOTHING;
 ELSIF TG_TABLE_NAME='group_event_participants' AND TG_OP='INSERT' THEN
  v_event:=NEW.event_id;v_actor:=NEW.user_id;
  SELECT e.group_id,e.organizer_id,e.title INTO v_group,v_recipient,v_title FROM public.group_events e WHERE e.id=v_event AND e.status='scheduled';
  IF v_recipient IS NOT NULL AND v_recipient<>v_actor AND NOT public.reading_group_notifications_muted(v_recipient,v_group) THEN
   v_message:='A member responded "'||NEW.response||'" to "'||left(v_title,100)||'".';v_link:='/groups/'||v_group::text||'#group-events';
   INSERT INTO public.notifications(user_id,actor_id,type,title,message,read,entity_type,entity_id,link)
   VALUES(v_recipient,v_actor,'reading_group_event_rsvp','New event RSVP',v_message,false,'group_event',v_event,v_link);
  END IF;
 ELSE RETURN NEW; END IF; RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_reading_group_activity() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_reading_group_event_activity() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
