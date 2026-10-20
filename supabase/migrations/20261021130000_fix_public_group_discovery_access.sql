-- Public reading-group previews may display counts, but anonymous clients must not
-- be able to read rows from group_chat_members or enumerate private memberships.
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
  WHERE gc.is_encrypted IS NOT TRUE
  GROUP BY gc.id;
$function$;

REVOKE ALL ON FUNCTION public.get_public_group_member_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_group_member_counts() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_group_member_counts() IS
  'Public-safe aggregate only: returns counts for discoverable non-encrypted reading groups and never exposes member rows or private-group counts.';
