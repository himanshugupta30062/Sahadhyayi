
DO $rls_opt$
DECLARE
  p record;
  v_qual text;
  v_check text;
  v_sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') ~* 'auth\.[a-z_]+\(\)'
        OR COALESCE(with_check, '') ~* 'auth\.[a-z_]+\(\)'
      )
  LOOP
    v_qual := CASE WHEN p.qual IS NULL THEN NULL
      ELSE regexp_replace(p.qual, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'gi')
      END;
    v_check := CASE WHEN p.with_check IS NULL THEN NULL
      ELSE regexp_replace(p.with_check, 'auth\.([a-z_]+)\(\)', '(select auth.\1())', 'gi')
      END;
    v_sql := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF v_qual IS NOT NULL THEN v_sql := v_sql || format(' USING (%s)', v_qual); END IF;
    IF v_check IS NOT NULL THEN v_sql := v_sql || format(' WITH CHECK (%s)', v_check); END IF;
    EXECUTE v_sql;
  END LOOP;
END
$rls_opt$;
