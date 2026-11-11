-- Notify active group members when someone else posts or replies in their reading group.
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
 ON CONFLICT DO NOTHING;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.notify_reading_group_activity() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS notify_reading_group_post ON public.reading_group_posts;
CREATE TRIGGER notify_reading_group_post AFTER INSERT ON public.reading_group_posts
 FOR EACH ROW EXECUTE FUNCTION public.notify_reading_group_activity();
DROP TRIGGER IF EXISTS notify_reading_group_post_comment ON public.reading_group_post_comments;
CREATE TRIGGER notify_reading_group_post_comment AFTER INSERT ON public.reading_group_post_comments
 FOR EACH ROW EXECUTE FUNCTION public.notify_reading_group_activity();
NOTIFY pgrst,'reload schema';
