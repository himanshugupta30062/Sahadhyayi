CREATE TABLE IF NOT EXISTS public.growth_partners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_name text NOT NULL,
 organization_type text NOT NULL DEFAULT 'bookstore' CHECK (organization_type IN ('bookstore','library','book_club','publisher','literary_organization','event_venue','author','other')),
 city text, state text, website text, contact_name text, contact_email text, contact_phone text, instagram_url text, source_url text,
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','researching','ready_to_contact','contacted','replied','interested','meeting','partnered','not_a_fit')),
 outreach_channel text CHECK (outreach_channel IN ('email','instagram','linkedin','phone','whatsapp','in_person')),
 last_contacted_at timestamptz, next_follow_up_at timestamptz, notes text, fit_score integer CHECK (fit_score BETWEEN 0 AND 100),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS growth_partners_status_idx ON public.growth_partners(status);
CREATE INDEX IF NOT EXISTS growth_partners_city_idx ON public.growth_partners(city);
ALTER TABLE public.growth_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage growth partners" ON public.growth_partners;
CREATE POLICY "Admins manage growth partners" ON public.growth_partners FOR ALL TO authenticated
 USING (public.has_role((SELECT auth.uid()), 'admin'::text))
 WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::text));