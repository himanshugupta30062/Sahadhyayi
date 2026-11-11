-- Correct per-group mute helper: global preferences and group mutes are separate tables.
CREATE OR REPLACE FUNCTION public.reading_group_notifications_muted(p_user uuid,p_group uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT coalesce((
   SELECT (mute.muted_until IS NULL OR mute.muted_until > now())
   FROM public.reading_group_notification_mutes mute
   WHERE mute.user_id=p_user AND mute.group_id=p_group
 ),false)
$$;
REVOKE ALL ON FUNCTION public.reading_group_notifications_muted(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reading_group_notifications_muted(uuid,uuid) TO authenticated;
