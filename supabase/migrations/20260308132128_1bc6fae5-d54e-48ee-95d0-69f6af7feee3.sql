CREATE TABLE public.book_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL,
  event_type text NOT NULL,
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.book_events
  FOR ALL USING (true) WITH CHECK (true);