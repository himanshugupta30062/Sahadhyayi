
-- Create table for personalized progress summaries
CREATE TABLE public.reading_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter_number)
);

-- Create table for 15-minute audio summaries
CREATE TABLE public.book_audio_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE UNIQUE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 900, -- 15 minutes
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user-generated content (alternative chapters/endings)
CREATE TABLE public.user_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('alternative_chapter', 'alternative_ending', 'continuation')),
  original_chapter_number INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for content feedback (likes, dislikes, suggestions)
CREATE TABLE public.content_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID REFERENCES public.user_generated_content(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'suggestion')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id, feedback_type)
);

-- Create table for community votes on user-generated content
CREATE TABLE public.content_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID REFERENCES public.user_generated_content(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Create table for comments on user-generated content
CREATE TABLE public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID REFERENCES public.user_generated_content(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking detailed reading progress
CREATE TABLE public.detailed_reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  pages_read INTEGER NOT NULL DEFAULT 0,
  total_pages INTEGER NOT NULL,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter_number)
);

-- Enable RLS on all tables
ALTER TABLE public.reading_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_audio_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailed_reading_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for reading_summaries
CREATE POLICY "Users can view their own reading summaries" 
  ON public.reading_summaries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading summaries" 
  ON public.reading_summaries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading summaries" 
  ON public.reading_summaries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for book_audio_summaries (public read access)
CREATE POLICY "Anyone can view book audio summaries" 
  ON public.book_audio_summaries 
  FOR SELECT 
  USING (true);

-- RLS policies for user_generated_content
CREATE POLICY "Users can view published content" 
  ON public.user_generated_content 
  FOR SELECT 
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own content" 
  ON public.user_generated_content 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" 
  ON public.user_generated_content 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for content_feedback
CREATE POLICY "Users can view all feedback" 
  ON public.content_feedback 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create feedback" 
  ON public.content_feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
  ON public.content_feedback 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for content_votes
CREATE POLICY "Users can view all votes" 
  ON public.content_votes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create votes" 
  ON public.content_votes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
  ON public.content_votes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for content_comments
CREATE POLICY "Users can view all comments" 
  ON public.content_comments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create comments" 
  ON public.content_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
  ON public.content_comments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for detailed_reading_progress
CREATE POLICY "Users can view their own detailed progress" 
  ON public.detailed_reading_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own detailed progress" 
  ON public.detailed_reading_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detailed progress" 
  ON public.detailed_reading_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql'
  SET search_path = 'public, pg_catalog';

-- Create triggers for updated_at columns
CREATE TRIGGER handle_reading_summaries_updated_at
  BEFORE UPDATE ON public.reading_summaries
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_book_audio_summaries_updated_at
  BEFORE UPDATE ON public.book_audio_summaries
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_user_generated_content_updated_at
  BEFORE UPDATE ON public.user_generated_content
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_content_comments_updated_at
  BEFORE UPDATE ON public.content_comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_detailed_reading_progress_updated_at
  BEFORE UPDATE ON public.detailed_reading_progress
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
