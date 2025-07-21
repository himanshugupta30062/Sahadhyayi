-- Create community_users table
CREATE TABLE IF NOT EXISTS public.community_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.community_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage membership" ON public.community_users
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
