-- The owner-only RLS policy already denies anonymous rows, but remove the
-- unnecessary table-level SELECT grant as defense in depth.
REVOKE ALL ON TABLE public.location_sharing_consent FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.location_sharing_consent TO authenticated;

NOTIFY pgrst, 'reload schema';
