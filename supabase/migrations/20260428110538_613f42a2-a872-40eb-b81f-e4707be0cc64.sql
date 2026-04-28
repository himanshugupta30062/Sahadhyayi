-- Security definer helper to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_chats
    WHERE id = _group_id AND created_by = _user_id
  );
$$;

-- Drop and recreate the recursive SELECT policy
DROP POLICY IF EXISTS "Members can view fellow group members" ON public.group_chat_members;

CREATE POLICY "Members can view fellow group members"
ON public.group_chat_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_group_member(group_id, auth.uid())
  OR public.is_group_creator(group_id, auth.uid())
);

-- Also fix the admin DELETE policy if it self-references
DROP POLICY IF EXISTS "Admins can remove members" ON public.group_chat_members;

CREATE POLICY "Admins can remove members"
ON public.group_chat_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members gcm
    WHERE gcm.group_id = group_chat_members.group_id
      AND gcm.user_id = auth.uid()
      AND gcm.role = 'admin'
  )
);
-- Note: the EXISTS subquery on the same table is OK only because the SELECT policy now uses SECURITY DEFINER helper for the recursive case.
-- To be fully safe, also rewrite using helper:
DROP POLICY IF EXISTS "Admins can remove members" ON public.group_chat_members;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_id = _group_id AND user_id = _user_id AND role = 'admin'
  );
$$;

CREATE POLICY "Admins can remove members"
ON public.group_chat_members
FOR DELETE
TO authenticated
USING (public.is_group_admin(group_id, auth.uid()));