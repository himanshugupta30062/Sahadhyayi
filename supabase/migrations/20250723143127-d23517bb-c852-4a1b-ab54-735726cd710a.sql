-- Create author_followers table to track who follows which authors
CREATE TABLE public.author_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, author_id)
);

-- Enable RLS
ALTER TABLE public.author_followers ENABLE ROW LEVEL SECURITY;

-- RLS policies for author_followers
CREATE POLICY "Users can follow authors" 
ON public.author_followers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow authors" 
ON public.author_followers 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their follows" 
ON public.author_followers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authors can view their followers" 
ON public.author_followers 
FOR SELECT 
USING (true);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_id UUID REFERENCES public.authors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_book', 'author_update', 'event_announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Function to update follower count in authors table
CREATE OR REPLACE FUNCTION update_author_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.authors 
    SET followers_count = followers_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.authors 
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update follower counts
CREATE TRIGGER author_follower_count_trigger
  AFTER INSERT OR DELETE ON public.author_followers
  FOR EACH ROW
  EXECUTE FUNCTION update_author_follower_count();

-- Function to create notifications for followers when author has updates
CREATE OR REPLACE FUNCTION notify_author_followers(
  author_uuid UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, author_id, type, title, message)
  SELECT 
    af.user_id,
    author_uuid,
    notification_type,
    notification_title,
    notification_message
  FROM public.author_followers af
  WHERE af.author_id = author_uuid;
END;
$$;

-- Update updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();