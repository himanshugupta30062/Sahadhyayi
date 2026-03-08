
-- Create user_published_books table
CREATE TABLE public.user_published_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  language TEXT DEFAULT 'English',
  pages INTEGER,
  isbn TEXT,
  cover_image_url TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_published_books ENABLE ROW LEVEL SECURITY;

-- Users can view their own books
CREATE POLICY "Users can view own published books"
  ON public.user_published_books FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Public can view approved books
CREATE POLICY "Anyone can view approved books"
  ON public.user_published_books FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Users can insert their own books
CREATE POLICY "Users can insert own books"
  ON public.user_published_books FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own books
CREATE POLICY "Users can update own books"
  ON public.user_published_books FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own books
CREATE POLICY "Users can delete own books"
  ON public.user_published_books FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all books
CREATE POLICY "Admins can view all published books"
  ON public.user_published_books FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all books (for approval/rejection)
CREATE POLICY "Admins can update all published books"
  ON public.user_published_books FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_user_published_books_updated_at
  BEFORE UPDATE ON public.user_published_books
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Storage policies for user-uploads path in books bucket
CREATE POLICY "Users can upload to user-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'books' AND (storage.foldername(name))[1] = 'user-uploads');

CREATE POLICY "Users can view user-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'books' AND (storage.foldername(name))[1] = 'user-uploads');

CREATE POLICY "Users can delete own user-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'books' AND (storage.foldername(name))[1] = 'user-uploads' AND owner = auth.uid());
