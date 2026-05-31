
-- Drop existing SELECT-capable ALL policies, recreate as INSERT/UPDATE/DELETE only
DROP POLICY IF EXISTS "Users can manage their social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users manage own social connections" ON public.social_connections;

CREATE POLICY "Users can insert their social connections"
  ON public.social_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their social connections"
  ON public.social_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their social connections"
  ON public.social_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No SELECT policy on base table -> client cannot read raw tokens via PostgREST
-- (service_role still bypasses RLS for server-side flows)

-- Token-free view for client reads
CREATE OR REPLACE VIEW public.social_connections_safe
WITH (security_invoker = on) AS
  SELECT id, user_id, platform, platform_user_id, platform_username,
         connected_at, last_synced_at
  FROM public.social_connections;

GRANT SELECT ON public.social_connections_safe TO authenticated;
