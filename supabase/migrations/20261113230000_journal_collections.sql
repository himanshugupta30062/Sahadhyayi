-- Migration: Add private Reading Journal Collections and entry mapping

CREATE TABLE IF NOT EXISTS public.journal_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 100),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),
  color TEXT DEFAULT 'amber',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.journal_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own journal collections" ON public.journal_collections;
CREATE POLICY "Users manage their own journal collections"
  ON public.journal_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS journal_collections_user_idx
  ON public.journal_collections (user_id, created_at DESC);

-- Collection assignment table for unified journal entries (highlights, notes, quotes)
CREATE TABLE IF NOT EXISTS public.journal_entry_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.journal_collections(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, entry_id)
);

ALTER TABLE public.journal_entry_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own journal entry collections" ON public.journal_entry_collections;
CREATE POLICY "Users manage their own journal entry collections"
  ON public.journal_entry_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS journal_entry_collections_user_entry_idx
  ON public.journal_entry_collections (user_id, entry_id);

COMMENT ON TABLE public.journal_collections IS 'Private reader-created collections for organizing reading notes, reflections, and quotes.';
COMMENT ON TABLE public.journal_entry_collections IS 'Join table linking journal entries to user collections.';
