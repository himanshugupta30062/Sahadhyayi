
-- Ensure RLS policies exist for user_profile table
DO $$
BEGIN
  -- Check if the policy already exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profile' 
    AND policyname = 'Users can manage own user_profile'
  ) THEN
    CREATE POLICY "Users can manage own user_profile"
      ON public.user_profile
      FOR ALL
      USING (auth.uid()::uuid = id)
      WITH CHECK (auth.uid()::uuid = id);
  END IF;
END$$;

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profile_username ON public.user_profile(username);
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON public.user_profile(email);
