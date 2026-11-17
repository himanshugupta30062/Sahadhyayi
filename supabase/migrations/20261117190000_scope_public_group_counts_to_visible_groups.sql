-- Expose aggregate counts only for groups that are actually public.
-- Never disclose the existence or membership size of private/unlisted groups.
CREATE OR REPLACE FUNCTION public.get_public_group_member_counts()
RETURNS TABLE (group_id uuid, member_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT gc.id AS group_id, count(gcm.user_id)::bigint AS member_count
  FROM public.group_chats AS gc
  LEFT JOIN public.group_chat_members AS gcm
    ON gcm.group_id = gc.id
   AND gcm.status = 'active'
  WHERE gc.visibility = 'public'
    AND gc.is_encrypted IS NOT TRUE
    AND gc.archived_at IS NULL
  GROUP BY gc.id;
$function$;

REVOKE ALL ON FUNCTION public.get_public_group_member_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_group_member_counts() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
