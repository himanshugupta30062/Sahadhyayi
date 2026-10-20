-- Notify the addressee when a new pending friend request is created.
-- Notification inserts are performed by this trigger, not by client-side INSERT grants.
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status = 'pending'
     AND NEW.requester_id IS NOT NULL
     AND NEW.addressee_id IS NOT NULL
     AND NEW.requester_id <> NEW.addressee_id THEN
    INSERT INTO public.notifications
      (user_id, author_id, actor_id, type, title, message, read, entity_type, entity_id, link)
    VALUES
      (
        NEW.addressee_id,
        NEW.requester_id,
        NEW.requester_id,
        'friend_request',
        'New friend request',
        'Someone sent you a friend request.',
        false,
        'profile',
        NEW.requester_id,
        '/social?tab=friends'
      );
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_friend_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_friend_request_created ON public.friend_requests;
CREATE TRIGGER notify_friend_request_created
AFTER INSERT ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_friend_request();
