
-- Create user_avatars table to store avatar customizations
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avatar_json JSONB,
  avatar_img_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_locations table for real-time location tracking
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Add location_sharing column to user_bookshelf if it doesn't exist
ALTER TABLE public.user_bookshelf 
ADD COLUMN IF NOT EXISTS location_sharing BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_avatars
CREATE POLICY "Users can view their own avatar" 
  ON public.user_avatars FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatar" 
  ON public.user_avatars FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar" 
  ON public.user_avatars FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view avatars for social features" 
  ON public.user_avatars FOR SELECT 
  USING (true);

-- RLS policies for user_locations
CREATE POLICY "Users can manage their own location" 
  ON public.user_locations FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Friends can view each other's locations" 
  ON public.user_locations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user1_id = auth.uid() AND user2_id = user_locations.user_id) 
         OR (user2_id = auth.uid() AND user1_id = user_locations.user_id)
    )
  );

-- Add trigger for updating user_avatars updated_at
CREATE OR REPLACE FUNCTION update_avatar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER avatar_updated_at_trigger
  BEFORE UPDATE ON public.user_avatars
  FOR EACH ROW EXECUTE FUNCTION update_avatar_updated_at();

-- Add trigger for updating user_locations last_updated
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_updated_trigger
  BEFORE UPDATE ON public.user_locations
  FOR EACH ROW EXECUTE FUNCTION update_location_timestamp();
