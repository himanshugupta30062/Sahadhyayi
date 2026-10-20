
CREATE OR REPLACE FUNCTION internal_security.has_location_consent(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.location_sharing_consent AS lsc
    WHERE lsc.user_id = user_uuid
      AND lsc.consented_at IS NOT NULL
  );
$function$;
REVOKE ALL ON FUNCTION internal_security.has_location_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal_security.has_location_consent(uuid) TO authenticated, service_role;
