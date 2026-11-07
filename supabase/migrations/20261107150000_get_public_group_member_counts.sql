-- Migration: Expose aggregate group member counts for public discovery
-- Aggregate-only public counts without exposing individual group_chat_members rows

CREATE OR REPLACE FUNCTION public.get_public_group_member_counts()
RETURNS TABLE (group_id uuid, member_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT group_id, count(*)::bigint AS member_count
  FROM public.group_chat_members
  GROUP BY group_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_group_member_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_group_member_counts() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_public_group_member_counts() IS 'Aggregated member counts per group chat for public directory preview without exposing membership rows.';
