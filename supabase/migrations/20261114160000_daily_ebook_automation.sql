-- Daily Ebook Automation: logging table and view

-- 1. Table to log each automation run
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  books_discovered INTEGER NOT NULL DEFAULT 0,
  books_verified INTEGER NOT NULL DEFAULT 0,
  books_inserted INTEGER NOT NULL DEFAULT 0,
  authors_enriched INTEGER NOT NULL DEFAULT 0,
  errors TEXT[] NOT NULL DEFAULT '{}',
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS automation_runs_started_at_idx
  ON public.automation_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS automation_runs_status_idx
  ON public.automation_runs(status);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only access to automation logs
CREATE POLICY "Admins can view automation runs"
  ON public.automation_runs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert/update (for the edge function)
CREATE POLICY "Service role can manage automation runs"
  ON public.automation_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. Helper view for recent automation runs (converted to IST)
CREATE OR REPLACE VIEW public.recent_automation_runs AS
SELECT
  run_id,
  started_at AT TIME ZONE 'Asia/Kolkata' AS started_at_ist,
  completed_at AT TIME ZONE 'Asia/Kolkata' AS completed_at_ist,
  status,
  books_discovered,
  books_verified,
  books_inserted,
  authors_enriched,
  errors,
  details,
  EXTRACT(EPOCH FROM (completed_at - started_at))::INT AS duration_seconds
FROM public.automation_runs
ORDER BY started_at DESC
LIMIT 50;

GRANT SELECT ON public.recent_automation_runs TO authenticated;

-- 3. Note: The daily automation is scheduled via GitHub Actions workflow
-- (.github/workflows/daily-ebook-automation.yml) which runs at 3:30 UTC
-- (9:00 AM Asia/Kolkata) and invokes the daily-ebook-automation edge function.
--
-- To enable pg_cron-based scheduling instead (requires pg_net extension):
--
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- CREATE OR REPLACE FUNCTION public.trigger_daily_ebook_automation()
-- RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
-- AS $$
-- DECLARE
--   v_url TEXT := current_setting('app.supabase_url', true) || '/functions/v1/daily-ebook-automation';
--   v_key TEXT := current_setting('app.supabase_service_role_key', true);
-- BEGIN
--   PERFORM net.http_post(
--     url := v_url,
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || v_key,
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
-- END;
-- $$;
--
-- SELECT cron.schedule('daily-ebook-automation', '30 3 * * *', 'SELECT public.trigger_daily_ebook_automation();');