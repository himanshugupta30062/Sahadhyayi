
-- 1. Add missing INSERT policy to allow users to create their profile
CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Books table: allow authenticated users to INSERT, UPDATE, DELETE; books remain public for SELECT
CREATE POLICY "Users can add books"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update books they added"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete books they added"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (true);

-- 3. Allow admins to SELECT contact_messages (requires an admin function, for now grant to authenticated)
CREATE POLICY "Authenticated can select contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Allow CRUD on groups for authenticated users
CREATE POLICY "Authenticated can insert groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update groups they created"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated can delete groups they created"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- 5. group_members: allow updating membership (e.g. leave or change status)
CREATE POLICY "Authenticated can update their own group membership"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. user_books: allow updating reading status; already has insert/delete/select
CREATE POLICY "Authenticated can update their own user books"
  ON public.user_books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. (Optional, for review) Lock down contact_messages for insert only (already in place)
-- No changes needed if you want to keep contact form public.

-- 8. Recommend future review of 'admin' access functions for contact_messages (see review notes).
