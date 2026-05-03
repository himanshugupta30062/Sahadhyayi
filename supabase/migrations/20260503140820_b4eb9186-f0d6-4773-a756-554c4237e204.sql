
-- 1. Phone verifications: remove client-side SELECT exposure of verification codes
DROP POLICY IF EXISTS "Users can view their own phone verifications" ON public.phone_verifications;

-- 2. user_roles: explicit restrictive policy to block non-admin writes
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
