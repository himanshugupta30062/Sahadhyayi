-- Create author_posts table for blog posts and updates
CREATE TABLE public.author_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('blog_post', 'status_update', 'announcement')) DEFAULT 'status_update',
  image_url TEXT,
  video_url TEXT,
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.author_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for author_posts
CREATE POLICY "Anyone can view published posts" 
ON public.author_posts 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Authors can manage their own posts" 
ON public.author_posts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.authors 
  WHERE id = author_id AND id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.authors 
  WHERE id = author_id AND id = auth.uid()
));

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.author_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_comments
CREATE POLICY "Anyone can view comments on published posts" 
ON public.post_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.author_posts 
  WHERE id = post_id AND is_published = true
));

CREATE POLICY "Authenticated users can create comments" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create post_reactions table
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.author_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'celebrate', 'insightful')) DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_reactions
CREATE POLICY "Anyone can view reactions on published posts" 
ON public.post_reactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.author_posts 
  WHERE id = post_id AND is_published = true
));

CREATE POLICY "Authenticated users can manage their reactions" 
ON public.post_reactions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_author_posts_updated_at
  BEFORE UPDATE ON public.author_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify followers when author posts
CREATE OR REPLACE FUNCTION notify_followers_on_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_catalog'
AS $$
BEGIN
  -- Only notify on insert of published posts
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    -- Get author name for notification
    INSERT INTO public.notifications (user_id, author_id, type, title, message)
    SELECT 
      af.user_id,
      NEW.author_id,
      CASE 
        WHEN NEW.post_type = 'blog_post' THEN 'author_update'
        WHEN NEW.post_type = 'announcement' THEN 'event_announcement'
        ELSE 'author_update'
      END,
      CASE 
        WHEN NEW.title IS NOT NULL THEN NEW.title
        ELSE 'New update from ' || a.name
      END,
      CASE 
        WHEN LENGTH(NEW.content) > 100 THEN LEFT(NEW.content, 100) || '...'
        ELSE NEW.content
      END
    FROM public.author_followers af
    JOIN public.authors a ON a.id = NEW.author_id
    WHERE af.author_id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to notify followers on new posts
CREATE TRIGGER notify_followers_on_author_post
  AFTER INSERT ON public.author_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_post();