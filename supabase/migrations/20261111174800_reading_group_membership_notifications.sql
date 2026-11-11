-- Reading Groups: notify group admins when a new member becomes active.
-- Membership alerts are in-app only and respect each admin's global/category preference and group mute.
CREATE OR REPLACE FUNCTION public.notify_reading_group_member_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_group_name text;
  v_joiner_name text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active'
     OR (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'active') THEN
    RETURN NEW;
  END IF;

  SELECT gc.name INTO v_group_name
  FROM public.group_chats gc WHERE gc.id = NEW.group_id;

  SELECT COALESCE(p.display_name, p.username, 'A reader')
    INTO v_joiner_name
  FROM public.profiles p WHERE p.id = NEW.user_id;

  INSERT INTO public.notifications
    (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
  SELECT admin_member.user_id, NEW.user_id,
    'reading_group_membership', 'New reading group member',
    COALESCE(v_joiner_name, 'A reader') || ' joined ' || COALESCE(v_group_name, 'your reading group') || '.',
    false, 'reading_group', NEW.group_id, '/groups/' || NEW.group_id::text
  FROM public.group_chat_members admin_member
  JOIN public.reading_group_notification_preferences pref
    ON pref.user_id = admin_member.user_id
  WHERE admin_member.group_id = NEW.group_id
    AND admin_member.status = 'active'
    AND admin_member.role = 'admin'
    AND admin_member.user_id <> NEW.user_id
    AND COALESCE(pref.enabled, true)
    AND COALESCE(pref.membership_activity, true)
    AND NOT public.reading_group_notifications_muted(admin_member.user_id, NEW.group_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_reading_group_member_joined() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_reading_group_member_joined ON public.group_chat_members;
CREATE TRIGGER notify_reading_group_member_joined
AFTER INSERT OR UPDATE OF status ON public.group_chat_members
FOR EACH ROW EXECUTE FUNCTION public.notify_reading_group_member_joined();

COMMENT ON FUNCTION public.notify_reading_group_member_joined() IS
  'In-app membership alerts for active group admins, honoring global/category preferences and per-group mutes.';
