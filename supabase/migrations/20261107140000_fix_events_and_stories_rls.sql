-- Migration: 20261107140000_fix_events_and_stories_rls.sql
-- Description: Fix RLS policies on literary_events, literary_event_categories, and stories so anon/authenticated users can view published content without permission errors.

-- 1. Fix literary_event_categories RLS
DROP POLICY IF EXISTS "Anyone can view active event categories" ON public.literary_event_categories;
CREATE POLICY "Anyone can view active event categories"
  ON public.literary_event_categories
  FOR SELECT
  USING (is_active = true);

-- 2. Fix literary_events RLS
DROP POLICY IF EXISTS "Anyone can view published book events" ON public.literary_events;
CREATE POLICY "Anyone can view published book events"
  ON public.literary_events
  FOR SELECT
  USING (status = 'published');

-- Allow authenticated users to submit event suggestions as draft
CREATE POLICY "Authenticated users can submit event drafts"
  ON public.literary_events
  FOR INSERT
  TO authenticated
  WITH CHECK (status = 'draft' OR status = 'published');

-- 3. Ensure stories and story_parts allow public reads for published content
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can view published stories" ON public.stories;
    CREATE POLICY "Public can view published stories"
      ON public.stories FOR SELECT
      USING (status = 'published' OR auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_parts') THEN
    ALTER TABLE public.story_parts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can view published story parts" ON public.story_parts;
    CREATE POLICY "Public can view published story parts"
      ON public.story_parts FOR SELECT
      USING (status = 'published' OR EXISTS (
        SELECT 1 FROM public.stories WHERE stories.id = story_parts.story_id AND stories.user_id = auth.uid()
      ));
  END IF;
END $$;

