-- Notify reel creators when another reader reacts or comments.
CREATE OR REPLACE FUNCTION public.notify_book_reel_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_creator uuid;
  v_reel uuid;
  v_actor uuid;
  v_type text;
  v_title text;
  v_message text;
BEGIN
  v_reel := NEW.reel_id;
  v_actor := NEW.user_id;

  SELECT r.user_id INTO v_creator
  FROM public.book_reels r
  WHERE r.id = v_reel;

  IF v_creator IS NULL OR v_creator = v_actor THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'book_reel_reactions' THEN
    v_type := 'book_reel_reaction';
    v_title := 'Someone reacted to your Book Reel';
    v_message := 'A reader reacted ' || NEW.emoji || ' to your Reel.';
  ELSIF TG_TABLE_NAME = 'book_reel_comments' THEN
    v_type := 'book_reel_comment';
    v_title := 'New comment on your Book Reel';
    v_message := left(NEW.body, 140);
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications
    (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
  VALUES
    (v_creator, v_actor, v_type, v_title, v_message, false,
     'book_reel', v_reel, '/social?tab=reels');

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_book_reel_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_book_reel_reaction ON public.book_reel_reactions;
CREATE TRIGGER notify_book_reel_reaction
AFTER INSERT ON public.book_reel_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_book_reel_activity();

DROP TRIGGER IF EXISTS notify_book_reel_comment ON public.book_reel_comments;
CREATE TRIGGER notify_book_reel_comment
AFTER INSERT ON public.book_reel_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_book_reel_activity();

NOTIFY pgrst, 'reload schema';
