-- Restrict research taxonomy access to non-guest signed-in readers.
-- Public pages already provide a built-in category list for guests.
REVOKE SELECT ON TABLE public.research_paper_categories FROM anon;
GRANT SELECT ON TABLE public.research_paper_categories TO authenticated;
DROP POLICY IF EXISTS "Research paper categories are public read" ON public.research_paper_categories;
CREATE POLICY "Signed-in readers can view research paper categories"
  ON public.research_paper_categories
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (auth.jwt() ->> 'is_anonymous') IS DISTINCT FROM 'true'
  );

-- Keep people collections public only when they have published profiles.
DROP POLICY IF EXISTS "Public read people collections" ON public.people_collections;
CREATE POLICY "Public read collections with published profiles"
  ON public.people_collections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.people_profiles AS person
      WHERE person.collection_id = people_collections.id
        AND person.published IS TRUE
    )
  );

-- Preserve the public feedback form while rejecting empty, malformed, or excessive submissions.
DROP POLICY IF EXISTS "Public can submit feedback" ON public.feedback;
CREATE POLICY "Public can submit validated feedback"
  ON public.feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND length(btrim(name)) BETWEEN 1 AND 120
    AND email IS NOT NULL
    AND length(email) <= 320
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND type IN ('general', 'feature', 'bug', 'review')
    AND (subject IS NULL OR length(subject) <= 160)
    AND message IS NOT NULL
    AND length(btrim(message)) BETWEEN 1 AND 3000
    AND (rating IS NULL OR rating BETWEEN 1 AND 5)
  );

NOTIFY pgrst, 'reload schema';