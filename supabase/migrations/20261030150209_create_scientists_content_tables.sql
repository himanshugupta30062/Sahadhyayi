-- Scientists collection: structured profiles, primary publications, and archival records.
-- Public read access is limited to published records; only admins may write.

CREATE TABLE IF NOT EXISTS public.scientists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL CHECK (region IN ('india', 'world')),
  discipline text NOT NULL,
  lifespan text NOT NULL,
  summary text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scientists_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS public.scientist_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scientist_id uuid NOT NULL REFERENCES public.scientists(id) ON DELETE CASCADE,
  title text NOT NULL, year text NOT NULL, venue text NOT NULL, authors text NOT NULL,
  doi text, url text NOT NULL,
  access text NOT NULL CHECK (access IN ('publisher', 'open', 'catalogue')),
  note text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scientist_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scientist_id uuid NOT NULL REFERENCES public.scientists(id) ON DELETE CASCADE,
  title text NOT NULL, institution text NOT NULL, url text NOT NULL, material text NOT NULL,
  note text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scientists_status_region_order_idx ON public.scientists (status, region, sort_order, name);
CREATE INDEX IF NOT EXISTS scientist_publications_scientist_order_idx ON public.scientist_publications (scientist_id, sort_order);
CREATE INDEX IF NOT EXISTS scientist_archives_scientist_order_idx ON public.scientist_archives (scientist_id, sort_order);

ALTER TABLE public.scientists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scientist_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scientist_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read published scientists" ON public.scientists FOR SELECT TO anon
  USING (status = 'published');
CREATE POLICY "Authenticated can read published scientists" ON public.scientists FOR SELECT TO authenticated
  USING (status = 'published' OR public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can insert scientists" ON public.scientists FOR INSERT TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can update scientists" ON public.scientists FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin')) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can delete scientists" ON public.scientists FOR DELETE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Anon can read publications for published scientists" ON public.scientist_publications FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.scientists s WHERE s.id = scientist_id AND s.status = 'published'));
CREATE POLICY "Authenticated can read publications for published scientists" ON public.scientist_publications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scientists s WHERE s.id = scientist_id AND (s.status = 'published' OR public.has_role((SELECT auth.uid()), 'admin'))));
CREATE POLICY "Admins can insert scientist publications" ON public.scientist_publications FOR INSERT TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can update scientist publications" ON public.scientist_publications FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin')) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can delete scientist publications" ON public.scientist_publications FOR DELETE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Anon can read archives for published scientists" ON public.scientist_archives FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.scientists s WHERE s.id = scientist_id AND s.status = 'published'));
CREATE POLICY "Authenticated can read archives for published scientists" ON public.scientist_archives FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scientists s WHERE s.id = scientist_id AND (s.status = 'published' OR public.has_role((SELECT auth.uid()), 'admin'))));
CREATE POLICY "Admins can insert scientist archives" ON public.scientist_archives FOR INSERT TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can update scientist archives" ON public.scientist_archives FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin')) WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins can delete scientist archives" ON public.scientist_archives FOR DELETE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

GRANT SELECT ON public.scientists, public.scientist_publications, public.scientist_archives TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scientists, public.scientist_publications, public.scientist_archives TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.scientists, public.scientist_publications, public.scientist_archives FROM anon;
