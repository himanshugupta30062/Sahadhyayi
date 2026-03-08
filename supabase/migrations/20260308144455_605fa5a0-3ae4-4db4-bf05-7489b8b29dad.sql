
-- Store user navigation preferences
CREATE TABLE public.user_nav_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  visible_tabs text[] NOT NULL DEFAULT ARRAY['library', 'bookshelf'],
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_nav_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own preferences
CREATE POLICY "Users can read own nav preferences"
  ON public.user_nav_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nav preferences"
  ON public.user_nav_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nav preferences"
  ON public.user_nav_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_user_nav_preferences_updated_at
  BEFORE UPDATE ON public.user_nav_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
