-- Create readers table for storing live reading locations
CREATE TABLE public.readers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  book TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;

-- Create policies for reader locations
CREATE POLICY "Anyone can view shared reading locations" 
ON public.readers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can share their location" 
ON public.readers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" 
ON public.readers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location" 
ON public.readers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_readers_updated_at
BEFORE UPDATE ON public.readers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.readers (name, book, lat, lng, user_id) VALUES
('Himanshu', 'Sapiens', 28.6139, 77.2090, NULL),
('Anjali', 'Atomic Habits', 28.60, 77.25, NULL),
('Ravi', 'Rich Dad Poor Dad', 28.63, 77.21, NULL);