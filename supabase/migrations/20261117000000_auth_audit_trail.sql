-- Privacy-conscious authentication audit trail for admin diagnostics.
CREATE TABLE IF NOT EXISTS public.auth_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'sign_in_attempted','sign_in_succeeded','sign_in_failed',
    'signup_submitted','account_created'
  )),
  auth_method text NOT NULL DEFAULT 'password' CHECK (auth_method IN ('password','oauth','unknown')),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  error_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_audit_events_created_at_idx
  ON public.auth_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS auth_audit_events_user_id_idx
  ON public.auth_audit_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.auth_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_audit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.auth_audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.get_admin_auth_activity(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  event_type text,
  auth_method text,
  user_id uuid,
  error_code text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT coalesce(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Unauthorized: administrators only'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT e.id, e.event_type, e.auth_method, e.user_id, e.error_code, e.created_at
  FROM public.auth_audit_events e
  ORDER BY e.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 100), 200));
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_auth_activity(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_auth_activity(integer) TO authenticated;
