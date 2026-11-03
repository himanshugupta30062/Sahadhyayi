-- Restore the feedback form backend and keep submitted feedback private to admins.
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  type text CHECK (type IS NULL OR type IN ('general', 'feature', 'bug', 'review')),
  subject text,
  message text,
  rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  responded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.feedback FROM anon, authenticated;
GRANT INSERT ON TABLE public.feedback TO anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.feedback TO authenticated;

DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback;
DROP POLICY IF EXISTS "Public can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;

CREATE POLICY "Public can submit feedback"
  ON public.feedback FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update feedback"
  ON public.feedback FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));
