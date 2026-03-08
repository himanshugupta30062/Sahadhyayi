
-- Add new columns to user_published_books
ALTER TABLE public.user_published_books
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downloads_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Drop old permissive RLS policies and replace with tighter ones
DROP POLICY IF EXISTS "Users can update own books" ON public.user_published_books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.user_published_books;

-- Users can only update own books that are draft or rejected
CREATE POLICY "Users can update own draft/rejected books"
  ON public.user_published_books FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status IN ('draft', 'rejected'))
  WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'pending_review', 'rejected'));

-- Users can only delete own non-approved books
CREATE POLICY "Users can delete own non-approved books"
  ON public.user_published_books FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status != 'approved');
