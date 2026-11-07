-- Migration: 20261107120000_short_stories_and_activity.sql
-- Description: Schema enhancements for Short Stories (standalone & multi-part series), discovery, reading progress, and social interactions.

-- 1. Enhance public.stories table
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS genre text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS story_type text NOT NULL DEFAULT 'standalone' CHECK (story_type IN ('standalone', 'series')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS completion_status text NOT NULL DEFAULT 'ongoing' CHECK (completion_status IN ('ongoing', 'completed')),
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reads_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookmarks_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follows_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_time_minutes integer NOT NULL DEFAULT 1;

-- Add check constraints for story limits safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_title_len_check'
  ) THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_title_len_check CHECK (char_length(title) <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_desc_len_check'
  ) THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_desc_len_check CHECK (description IS NULL OR char_length(description) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_tags_max_check'
  ) THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_tags_max_check CHECK (cardinality(tags) <= 5);
  END IF;
END $$;

-- 2. Create story_parts table for series / multi-part stories
CREATE TABLE IF NOT EXISTS public.story_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  part_number integer NOT NULL CHECK (part_number >= 1 AND part_number <= 30),
  title text NOT NULL CHECK (char_length(title) <= 150),
  content text NOT NULL CHECK (char_length(content) <= 5000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, part_number)
);

-- 3. Create story_bookmarks table
CREATE TABLE IF NOT EXISTS public.story_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

-- 4. Create story_follows table
CREATE TABLE IF NOT EXISTS public.story_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

-- 5. Create story_likes table
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

-- 6. Create story_reading_progress table
CREATE TABLE IF NOT EXISTS public.story_reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_part_id uuid REFERENCES public.story_parts(id) ON DELETE SET NULL,
  last_read_part_number integer NOT NULL DEFAULT 1,
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

-- 7. Create story_comments table
CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.story_parts(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Indexes for feed and discovery performance
CREATE INDEX IF NOT EXISTS idx_stories_status_published_at ON public.stories (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status_views_count ON public.stories (status, views_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status_genre ON public.stories (status, genre);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories (user_id);
CREATE INDEX IF NOT EXISTS idx_story_parts_story_part ON public.story_parts (story_id, part_number);
CREATE INDEX IF NOT EXISTS idx_story_parts_status ON public.story_parts (status);
CREATE INDEX IF NOT EXISTS idx_story_bookmarks_user ON public.story_bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_story_follows_user ON public.story_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON public.story_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_user ON public.story_reading_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story ON public.story_comments (story_id, created_at ASC);

-- 9. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Stories: Anyone can read published stories; authors can read all their own stories (including drafts)
DROP POLICY IF EXISTS "Stories are readable if published or owner" ON public.stories;
CREATE POLICY "Stories are readable if published or owner" ON public.stories
  FOR SELECT USING (
    status = 'published' OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Users can insert own stories" ON public.stories;
CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

-- Story Parts: Published parts of published stories are readable; authors can read/write all parts of their stories
DROP POLICY IF EXISTS "Published parts are viewable by anyone, drafts by author" ON public.story_parts;
CREATE POLICY "Published parts are viewable by anyone, drafts by author" ON public.story_parts
  FOR SELECT USING (
    (status = 'published' AND EXISTS (
      SELECT 1 FROM public.stories s WHERE s.id = story_parts.story_id AND s.status = 'published'
    ))
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stories s WHERE s.id = story_parts.story_id AND s.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Authors can insert parts to own stories" ON public.story_parts;
CREATE POLICY "Authors can insert parts to own stories" ON public.story_parts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stories s WHERE s.id = story_parts.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can update parts of own stories" ON public.story_parts;
CREATE POLICY "Authors can update parts of own stories" ON public.story_parts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stories s WHERE s.id = story_parts.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can delete parts of own stories" ON public.story_parts;
CREATE POLICY "Authors can delete parts of own stories" ON public.story_parts
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.stories s WHERE s.id = story_parts.story_id AND s.user_id = auth.uid()
    )
  );

-- Story Bookmarks
DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.story_bookmarks;
CREATE POLICY "Users manage own bookmarks" ON public.story_bookmarks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Story Follows
DROP POLICY IF EXISTS "Users manage own follows" ON public.story_follows;
CREATE POLICY "Users manage own follows" ON public.story_follows
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Story Likes
DROP POLICY IF EXISTS "Users manage own likes" ON public.story_likes;
CREATE POLICY "Users manage own likes" ON public.story_likes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reading Progress
DROP POLICY IF EXISTS "Users manage own reading progress" ON public.story_reading_progress;
CREATE POLICY "Users manage own reading progress" ON public.story_reading_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Story Comments
DROP POLICY IF EXISTS "Comments on published stories are viewable" ON public.story_comments;
CREATE POLICY "Comments on published stories are viewable" ON public.story_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_comments.story_id AND s.status = 'published')
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.story_comments;
CREATE POLICY "Authenticated users can comment" ON public.story_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can delete own comments" ON public.story_comments;
CREATE POLICY "Users can delete own comments" ON public.story_comments
  FOR DELETE USING (auth.uid() = user_id);
