-- Create table for website feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  type TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  responded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view feedback" ON public.feedback
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins manage feedback" ON public.feedback
  FOR UPDATE USING (public.is_admin());
