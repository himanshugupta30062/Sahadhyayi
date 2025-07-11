-- Track actual website visits
CREATE TABLE IF NOT EXISTS public.website_visits (
  id BIGSERIAL PRIMARY KEY,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT
);

-- Enable row level security so inserts can be limited if needed
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even anon) to insert visit records
CREATE POLICY "Public can record visits" ON public.website_visits
  FOR INSERT WITH CHECK (true);

-- Only admins can view visit details
CREATE POLICY "Admins can view visits" ON public.website_visits
  FOR SELECT USING (public.is_admin());
