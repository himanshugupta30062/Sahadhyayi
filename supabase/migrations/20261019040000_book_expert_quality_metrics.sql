-- Book Expert operational quality metrics.
-- No raw prompts, replies, IP addresses, or account identifiers are stored.
-- Usage events and feedback are retained for 90 days, independently of library data.

CREATE TABLE IF NOT EXISTS public.book_expert_usage_events (
  request_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  model text NOT NULL,
  success boolean NOT NULL,
  duration_ms integer NOT NULL CHECK (duration_ms >= 0),
  retrieved_book_count smallint NOT NULL DEFAULT 0
    CHECK (retrieved_book_count >= 0 AND retrieved_book_count <= 5),
  prompt_tokens integer CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  upstream_status integer,
  failure_class text CHECK (
    failure_class IS NULL OR failure_class IN (
      'timeout',
      'provider_error',
      'empty_response',
      'internal_error'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_book_expert_usage_created_at
  ON public.book_expert_usage_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_expert_usage_model_created
  ON public.book_expert_usage_events(model, created_at DESC);

CREATE TABLE IF NOT EXISTS public.book_expert_feedback (
  request_id uuid PRIMARY KEY
    REFERENCES public.book_expert_usage_events(request_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  rating smallint NOT NULL CHECK (rating IN (-1, 1))
);

CREATE INDEX IF NOT EXISTS idx_book_expert_feedback_created_at
  ON public.book_expert_feedback(created_at DESC);

ALTER TABLE public.book_expert_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_expert_feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_expert_usage_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.book_expert_feedback FROM PUBLIC, anon, authenticated;

-- Authenticated administrators can inspect aggregate-quality source records.
-- Raw prompts and generated answers are never stored in these tables.
GRANT SELECT ON TABLE public.book_expert_usage_events TO authenticated;
GRANT SELECT ON TABLE public.book_expert_feedback TO authenticated;
GRANT ALL ON TABLE public.book_expert_usage_events TO service_role;
GRANT ALL ON TABLE public.book_expert_feedback TO service_role;

DROP POLICY IF EXISTS "Admins can view Book Expert usage metrics"
  ON public.book_expert_usage_events;
CREATE POLICY "Admins can view Book Expert usage metrics"
  ON public.book_expert_usage_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view Book Expert feedback"
  ON public.book_expert_feedback;
CREATE POLICY "Admins can view Book Expert feedback"
  ON public.book_expert_feedback
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Keep only 90 days of operational telemetry. Feedback cascades with its request.
DO $$
DECLARE
  existing_job record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR existing_job IN
      SELECT jobid FROM cron.job WHERE jobname = 'book-expert-usage-retention'
    LOOP
      PERFORM cron.unschedule(existing_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
      'book-expert-usage-retention',
      '20 3 * * *',
      'DELETE FROM public.book_expert_usage_events WHERE created_at < now() - interval ''90 days'';'
    );
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
