-- Security/performance advisor follow-up.
-- Keep spoiler content gated by the caller's RLS policies, not the view owner's privileges.
CREATE OR REPLACE VIEW public.spoiler_threads_safe
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.book_id,
  t.user_id,
  t.title,
  CASE
    WHEN public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter
      THEN t.body
    ELSE NULL::text
  END AS body,
  t.min_chapter,
  public.user_chapter_progress(auth.uid(), t.book_id) >= t.min_chapter AS is_unlocked,
  t.created_at,
  t.updated_at
FROM public.spoiler_threads AS t;

GRANT SELECT ON public.spoiler_threads_safe TO authenticated;

-- Analytics event tables intentionally have no client-readable policies:
-- writes are performed by the SECURITY DEFINER ingest RPC / Edge Function,
-- and the analytics RPC returns aggregated data only. Explicitly document and
-- retain deny-by-default table access so the RLS advisor warning is understood.
ALTER TABLE public.website_visit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.website_visit_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.website_visit_events TO service_role;

-- Support time-windowed stats and visitor/session aggregation without sequential scans.
CREATE INDEX IF NOT EXISTS idx_website_action_events_user_created_at
  ON public.website_action_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_visit_events_created_event
  ON public.website_visit_events (created_at DESC, event_type);

CREATE INDEX IF NOT EXISTS idx_website_visit_events_session_created
  ON public.website_visit_events (session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_website_visit_events_visitor_created
  ON public.website_visit_events (visitor_id, created_at DESC)
  WHERE visitor_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
