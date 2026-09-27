-- Community feed posts are visible to signed-in readers, not anonymous clients.
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts and friends' posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can view social feed posts" ON public.posts;

CREATE POLICY "Authenticated users can view social feed posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;

-- Comments follow the same signed-in community visibility as their posts.
DROP POLICY IF EXISTS "Anyone can view post comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view comments on their posts" ON public.post_comments;
DROP POLICY IF EXISTS "Users can view comments on friends posts" ON public.post_comments;
DROP POLICY IF EXISTS "Authenticated users can view comments on feed posts" ON public.post_comments;

CREATE POLICY "Authenticated users can view comments on feed posts"
  ON public.post_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts AS visible_post
      WHERE visible_post.id = post_comments.post_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;

-- Groups must be discoverable before someone can join them.
DROP POLICY IF EXISTS "Anyone can view all groups" ON public.group_chats;
DROP POLICY IF EXISTS "Group members can view group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Members can view their group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Authenticated users can discover reading groups" ON public.group_chats;

CREATE POLICY "Authenticated users can discover reading groups"
  ON public.group_chats
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_chat_members TO authenticated;

-- A reader can join as a member; only the group creator can assign their own
-- initial admin membership. Do not let the general self-join policy grant admin.
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_chat_members;
DROP POLICY IF EXISTS "Authenticated users can join reading groups" ON public.group_chat_members;
DROP POLICY IF EXISTS "Group creators can add themselves as group admins" ON public.group_chat_members;

CREATE POLICY "Authenticated users can join reading groups"
  ON public.group_chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'member');

CREATE POLICY "Group creators can add themselves as group admins"
  ON public.group_chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.group_chats
      WHERE id = group_chat_members.group_id
        AND created_by = auth.uid()
    )
  );
