-- Keep direct table reads consistent with the public author-directory RPCs.
-- Anonymous and non-admin authenticated users may read authentic author records only.
-- Admins retain access to non-authentic records for moderation and cleanup.
DROP POLICY IF EXISTS "Anyone can view author public info" ON public.authors;

CREATE POLICY "Public can view authentic authors"
ON public.authors
FOR SELECT
TO anon
USING (is_authentic IS TRUE);

CREATE POLICY "Authenticated users can view authentic authors or administer all"
ON public.authors
FOR SELECT
TO authenticated
USING (is_authentic IS TRUE OR public.is_admin());

COMMENT ON POLICY "Public can view authentic authors" ON public.authors IS
  'Anonymous readers can only query authentic author directory records.';
COMMENT ON POLICY "Authenticated users can view authentic authors or administer all" ON public.authors IS
  'Authenticated readers see authentic authors; admins retain access to all records for moderation.';
