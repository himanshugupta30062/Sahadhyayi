-- Create table for likes on post comments
CREATE TABLE public.author_post_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.author_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.author_post_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their comment likes" ON public.author_post_comment_likes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment likes" ON public.author_post_comment_likes
FOR SELECT USING (true);
