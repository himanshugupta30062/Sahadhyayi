-- Create dedicated newsletter subscribers table for public homepage subscription
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce uniqueness on normalized (lowercase, trimmed) email address
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique_idx
  ON public.newsletter_subscribers (LOWER(TRIM(email)));

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public (anonymous and authenticated) visitors to subscribe
CREATE POLICY "Public can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'active'
    AND length(trim(email)) >= 5
    AND length(trim(email)) <= 320
  );

-- Only administrators may view subscriber details
CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- RLS policies do not grant SQL privileges. Explicitly expose only the
-- operations needed by the public signup form and the admin subscriber view.
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;

COMMENT ON TABLE public.newsletter_subscribers IS
'Stores public newsletter subscriptions with email uniqueness and admin-only read access.';

NOTIFY pgrst, 'reload schema';
