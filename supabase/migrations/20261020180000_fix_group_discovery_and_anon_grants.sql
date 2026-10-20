-- Restore public reading-group discovery without exposing invite-only group metadata.
-- The UI uses is_encrypted as its invite-only flag; keep that existing contract intact.

DROP POLICY IF EXISTS "Members can view their group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Authenticated users can discover reading groups" ON public.group_chats;
DROP POLICY IF EXISTS "Anyone can discover public reading groups" ON public.group_chats;
DROP POLICY IF EXISTS "Readers can discover public groups and access their own invite-only groups" ON public.group_chats;

CREATE POLICY "Anyone can discover public reading groups"
  ON public.group_chats
  FOR SELECT
  TO anon
  USING (is_encrypted IS NOT TRUE);

CREATE POLICY "Readers can discover public groups and access their own invite-only groups"
  ON public.group_chats
  FOR SELECT
  TO authenticated
  USING (
    is_encrypted IS NOT TRUE
    OR created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.group_chat_members AS gcm
      WHERE gcm.group_id = group_chats.id
        AND gcm.user_id = (SELECT auth.uid())
    )
  );

-- Anonymous visitors may browse public group metadata, but must not access
-- memberships or messages. Remove the broad default grants and restore only
-- the minimum privileges needed by the public directory.
REVOKE ALL PRIVILEGES ON TABLE public.group_chats FROM anon;
GRANT SELECT ON TABLE public.group_chats TO anon;

REVOKE ALL PRIVILEGES ON TABLE public.group_chat_members FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.group_messages FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_chat_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_messages TO authenticated;
