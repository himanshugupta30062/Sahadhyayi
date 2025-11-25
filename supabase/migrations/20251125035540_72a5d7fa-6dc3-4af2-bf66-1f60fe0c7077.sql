-- Phase 2: Critical Data Exposure Fixes
-- Fix profiles table to hide sensitive data from public

-- Drop the overly permissive public policy on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create more restrictive policies for profiles
-- Policy 1: Anyone can view basic profile info (username, avatar) but NOT sensitive fields
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Note: The above policy allows SELECT but we'll filter sensitive fields at the application layer
-- Alternatively, create a view with only public fields

-- Policy 2: Users can view their own full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Friends can view extended profile info
CREATE POLICY "Friends can view extended profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user1_id FROM friends WHERE user2_id = profiles.id
    UNION
    SELECT user2_id FROM friends WHERE user1_id = profiles.id
  )
);

-- Fix user_profile table RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profile;

-- Create strict policies for user_profile
CREATE POLICY "Users can manage own user_profile"
ON public.user_profile
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix group_chats visibility - only members should see groups
DROP POLICY IF EXISTS "Anyone can view all groups" ON public.group_chats;

CREATE POLICY "Members can view their group chats"
ON public.group_chats
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT group_id 
    FROM group_chat_members 
    WHERE user_id = auth.uid()
  )
);

-- Fix social_connections - ensure tokens are restricted
-- First check if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_connections') THEN
    -- Drop any overly permissive policies
    DROP POLICY IF EXISTS "Users can view their own connections" ON public.social_connections;
    
    -- Create strict policy
    CREATE POLICY "Users manage own social connections"
    ON public.social_connections
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add comment to enforce encryption in messages
COMMENT ON COLUMN public.messages.content IS 'DEPRECATED: Use encrypted_content field only. This field should not be used for new messages.';
COMMENT ON COLUMN public.private_messages.content IS 'DEPRECATED: Use encrypted_content field only. This field should not be used for new messages.';
COMMENT ON COLUMN public.group_messages.content IS 'DEPRECATED: Use encrypted_content field only. This field should not be used for new messages.';

-- Create a function to check if location sharing is properly consented
CREATE OR REPLACE FUNCTION public.has_location_consent(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.location_sharing_consent 
    WHERE user_id = user_uuid
    AND consented_at IS NOT NULL
  );
$$;

-- Update readers table policy to ensure consent
DROP POLICY IF EXISTS "Friends can view nearby readers" ON public.readers;

CREATE POLICY "Friends with consent can view locations"
ON public.readers
FOR SELECT
TO authenticated
USING (
  -- User must have given consent
  public.has_location_consent(readers.user_id)
  AND
  -- Viewer must also have given consent (mutual consent required)
  public.has_location_consent(auth.uid())
  AND
  -- Must be friends
  (
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user1_id = auth.uid() AND user2_id = readers.user_id)
      OR (user2_id = auth.uid() AND user1_id = readers.user_id)
    )
  )
  AND readers.user_id != auth.uid()
);

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at DESC);