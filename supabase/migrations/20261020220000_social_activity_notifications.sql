-- Social activity notifications. Trigger-owned inserts bypass client INSERT grants while recipient RLS stays intact.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS link text;

CREATE INDEX IF NOT EXISTS notifications_user_unread_created_idx
  ON public.notifications (user_id, read, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_social_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_recipient uuid;
  v_actor uuid;
  v_post_id uuid;
  v_parent_author uuid;
  v_title text;
  v_message text;
  v_type text;
  v_entity_type text;
  v_entity_id uuid;
  v_link text;
BEGIN
  v_actor := NULL;
  v_recipient := NULL;
  v_type := NULL;
  v_entity_type := NULL;
  v_entity_id := NULL;
  v_link := '/social';

  IF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'INSERT' THEN
    v_actor := NEW.follower_id;
    v_recipient := NEW.following_id;
    v_type := 'new_follower';
    v_title := 'New follower';
    v_message := 'Someone started following you.';
    v_entity_type := 'profile';
    v_entity_id := v_actor;
    v_link := '/social?tab=friends';
  ELSIF TG_TABLE_NAME = 'post_likes' AND TG_OP = 'INSERT' THEN
    v_actor := NEW.user_id;
    SELECT p.user_id INTO v_recipient FROM public.posts p WHERE p.id = NEW.post_id;
    v_type := 'post_like';
    v_title := 'Someone liked your post';
    v_message := 'Someone liked a post you shared.';
    v_entity_type := 'post';
    v_entity_id := NEW.post_id;
  ELSIF TG_TABLE_NAME = 'post_comments' AND TG_OP = 'INSERT' THEN
    v_actor := NEW.user_id;
    v_post_id := NEW.post_id;
    v_entity_type := 'post';
    v_entity_id := NEW.post_id;

    IF NEW.parent_comment_id IS NOT NULL THEN
      SELECT c.user_id INTO v_parent_author
      FROM public.post_comments c WHERE c.id = NEW.parent_comment_id;
      IF v_parent_author IS NOT NULL AND v_parent_author <> v_actor THEN
        INSERT INTO public.notifications
          (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
        VALUES
          (v_parent_author, v_actor, 'comment_reply', 'New reply', 'Someone replied to your comment.',
           false, 'post', v_post_id, '/social');
      END IF;
    END IF;

    SELECT p.user_id INTO v_recipient FROM public.posts p WHERE p.id = v_post_id;
    v_type := 'post_comment';
    v_title := 'New comment on your post';
    v_message := 'Someone commented on a post you shared.';
    IF v_recipient = v_parent_author AND v_parent_author <> v_actor THEN
      v_recipient := NULL;
    END IF;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_recipient IS NOT NULL AND v_actor IS NOT NULL AND v_recipient <> v_actor THEN
    INSERT INTO public.notifications
      (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
    VALUES
      (v_recipient, v_actor, v_type, v_title, v_message, false, v_entity_type, v_entity_id, v_link);
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_social_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_new_follower ON public.user_follows;
CREATE TRIGGER notify_new_follower AFTER INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_social_activity();

DROP TRIGGER IF EXISTS notify_post_like ON public.post_likes;
CREATE TRIGGER notify_post_like AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_social_activity();

DROP TRIGGER IF EXISTS notify_post_comment ON public.post_comments;
CREATE TRIGGER notify_post_comment AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_social_activity();

NOTIFY pgrst, 'reload schema';
