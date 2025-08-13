-- Strengthen RLS for user_profile table and expose public safe view
-- PUBLIC_USER_PROFILE_DATA

-- 1. Ensure table has RLS enabled and drop existing broad policy
ALTER TABLE IF EXISTS public.user_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own user_profile" ON public.user_profile;

-- 2. Policy: users can select their own profile
CREATE POLICY "Users can select own user_profile"
  ON public.user_profile
  FOR SELECT
  USING (auth.uid()::uuid = id);

-- 3. Policy: users can insert their own profile
CREATE POLICY "Users can insert own user_profile"
  ON public.user_profile
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = id);

-- 4. Policy: users can update their own profile
CREATE POLICY "Users can update own user_profile"
  ON public.user_profile
  FOR UPDATE
  USING (auth.uid()::uuid = id)
  WITH CHECK (auth.uid()::uuid = id);

-- 5. Policy: users can delete their own profile
CREATE POLICY "Users can delete own user_profile"
  ON public.user_profile
  FOR DELETE
  USING (auth.uid()::uuid = id);

-- 6. Policy: service role has full access for maintenance tasks
CREATE POLICY "Service role full access to user_profile"
  ON public.user_profile
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Create a safe view exposing only public profile information
CREATE OR REPLACE VIEW public.public_user_profile_data AS
SELECT id,
       username,
       profile_picture_url,
       bio,
       joined_at
FROM public.user_profile
WHERE deleted IS NOT TRUE;

-- Grant read access to anonymous and authenticated users for the view
GRANT SELECT ON public.public_user_profile_data TO anon, authenticated;
