-- Create Q&A system for author-reader interaction
CREATE TABLE public.author_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Create events system for author appearances
CREATE TABLE public.author_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'signing', -- signing, livestream, reading, conference, etc.
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT, -- physical location or "Online"
  event_url TEXT, -- link for virtual events or tickets
  image_url TEXT,
  max_attendees INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event RSVPs/interest tracking
CREATE TABLE public.author_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'interested', -- interested, attending, maybe
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Add verification status to authors table
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS verification_type TEXT; -- 'publisher', 'document', 'manual'

-- Enable RLS on new tables
ALTER TABLE public.author_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS policies for author_questions
CREATE POLICY "Anyone can view published answered questions" 
ON public.author_questions 
FOR SELECT 
USING (is_published = true AND is_answered = true);

CREATE POLICY "Users can ask questions" 
ON public.author_questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can view all questions for them" 
ON public.author_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.authors 
  WHERE authors.id = author_questions.author_id 
  AND authors.id = auth.uid()
));

CREATE POLICY "Authors can answer their questions" 
ON public.author_questions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.authors 
  WHERE authors.id = author_questions.author_id 
  AND authors.id = auth.uid()
));

CREATE POLICY "Users can view their own questions" 
ON public.author_questions 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS policies for author_events
CREATE POLICY "Anyone can view published events" 
ON public.author_events 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Authors can manage their events" 
ON public.author_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.authors 
  WHERE authors.id = author_events.author_id 
  AND authors.id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.authors 
  WHERE authors.id = author_events.author_id 
  AND authors.id = auth.uid()
));

-- RLS policies for author_event_attendees
CREATE POLICY "Users can manage their event attendance" 
ON public.author_event_attendees 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can view attendees for their events" 
ON public.author_event_attendees 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.author_events 
  JOIN public.authors ON authors.id = author_events.author_id
  WHERE author_events.id = author_event_attendees.event_id 
  AND authors.id = auth.uid()
));

-- Add updated_at triggers
CREATE TRIGGER update_author_questions_updated_at
  BEFORE UPDATE ON public.author_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_author_events_updated_at
  BEFORE UPDATE ON public.author_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify followers when author answers a question
CREATE OR REPLACE FUNCTION public.notify_followers_on_qa_answer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when a question gets answered for the first time
  IF TG_OP = 'UPDATE' AND NEW.is_answered = true AND OLD.is_answered = false AND NEW.is_published = true THEN
    INSERT INTO public.notifications (user_id, author_id, type, title, message)
    SELECT 
      af.user_id,
      NEW.author_id,
      'qa_answer',
      a.name || ' answered a question',
      CASE 
        WHEN LENGTH(NEW.answer) > 100 THEN LEFT(NEW.answer, 100) || '...'
        ELSE NEW.answer
      END
    FROM public.author_followers af
    JOIN public.authors a ON a.id = NEW.author_id
    WHERE af.author_id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify followers when author creates an event
CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on insert of published events
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    INSERT INTO public.notifications (user_id, author_id, type, title, message)
    SELECT 
      af.user_id,
      NEW.author_id,
      'author_event',
      a.name || ' has a new event',
      NEW.title || ' - ' || to_char(NEW.start_date, 'Mon DD, YYYY')
    FROM public.author_followers af
    JOIN public.authors a ON a.id = NEW.author_id
    WHERE af.author_id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for notifications
CREATE TRIGGER notify_followers_on_qa_answer_trigger
  AFTER UPDATE ON public.author_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_qa_answer();

CREATE TRIGGER notify_followers_on_event_trigger
  AFTER INSERT ON public.author_events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_event();