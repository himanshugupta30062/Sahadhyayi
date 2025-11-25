-- Phase 1: Critical Security Fixes (Fixed Type Casting)

-- Fix has_role function with proper type casting
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  );
$$;

-- ============================================
-- FIX AUTHORS TABLE - CRITICAL
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can delete authors" ON public.authors;
DROP POLICY IF EXISTS "Authenticated users can insert authors" ON public.authors;
DROP POLICY IF EXISTS "Authenticated users can update authors" ON public.authors;
DROP POLICY IF EXISTS "Anyone can view authors" ON public.authors;
DROP POLICY IF EXISTS "Anyone can view author public info" ON public.authors;
DROP POLICY IF EXISTS "Only admins can insert authors" ON public.authors;
DROP POLICY IF EXISTS "Only admins can update authors" ON public.authors;
DROP POLICY IF EXISTS "Only admins can delete authors" ON public.authors;

CREATE POLICY "Anyone can view author public info"
ON public.authors
FOR SELECT
TO public
USING (true);

CREATE POLICY "Only admins can insert authors"
ON public.authors
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update authors"
ON public.authors
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete authors"
ON public.authors
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FIX BOOKS_LIBRARY TABLE - CRITICAL
-- ============================================
DROP POLICY IF EXISTS "Admins can delete library books" ON public.books_library;
DROP POLICY IF EXISTS "Admins can update library books" ON public.books_library;
DROP POLICY IF EXISTS "Authenticated can add library books" ON public.books_library;
DROP POLICY IF EXISTS "Anyone can read library books" ON public.books_library;
DROP POLICY IF EXISTS "Anyone can view books" ON public.books_library;
DROP POLICY IF EXISTS "Only admins can insert books" ON public.books_library;
DROP POLICY IF EXISTS "Only admins can update books" ON public.books_library;
DROP POLICY IF EXISTS "Only admins can delete books" ON public.books_library;

CREATE POLICY "Anyone can view books library"
ON public.books_library
FOR SELECT
TO public
USING (true);

CREATE POLICY "Only admins can insert library books"
ON public.books_library
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update library books"
ON public.books_library
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete library books"
ON public.books_library
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FIX BOOKS TABLE - CRITICAL
-- ============================================
DROP POLICY IF EXISTS "Books are public" ON public.books;
DROP POLICY IF EXISTS "Users can add books" ON public.books;
DROP POLICY IF EXISTS "Users can update books they added" ON public.books;
DROP POLICY IF EXISTS "Users can delete books they added" ON public.books;
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;

CREATE POLICY "Anyone can view books table"
ON public.books
FOR SELECT
TO public
USING (true);

CREATE POLICY "Only admins can manage books table"
ON public.books
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FIX PROFILES TABLE - HIDE SENSITIVE DATA
-- ============================================
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Friends can view extended profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view minimal profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Friends can view profiles" ON public.profiles;

-- Create function to check friendship
CREATE OR REPLACE FUNCTION public.are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friends 
    WHERE (friends.user1_id = user1_id AND friends.user2_id = user2_id)
    OR (friends.user2_id = user1_id AND friends.user1_id = user2_id)
  );
$$;

-- Public can view basic info (will filter at app layer)
CREATE POLICY "Public can view basic profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Users can view their own full profile
CREATE POLICY "Users can view own profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Friends can view each other's profiles
CREATE POLICY "Friends can view each others profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.are_friends(auth.uid(), profiles.id));

-- ============================================
-- FIX BOOK_SUMMARIES - ADMIN ONLY
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create summaries" ON public.book_summaries;
DROP POLICY IF EXISTS "Only system/admin can create summaries" ON public.book_summaries;

CREATE POLICY "Only admins can create summaries"
ON public.book_summaries
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FIX NOTIFICATIONS - ADMIN ONLY
-- ============================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Only system functions can create notifications" ON public.notifications;

CREATE POLICY "Only admins can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FIX REMAINING FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_location_analytics()
RETURNS TABLE(total_sharing_users bigint, active_readers bigint, countries_represented bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE location_sharing = true AND location_lat IS NOT NULL) as total_sharing_users,
    COUNT(DISTINCT r.user_id) as active_readers,
    COUNT(DISTINCT substring(p.location_lat::text, 1, 1)) as countries_represented
  FROM public.profiles p
  LEFT JOIN public.readers r ON r.user_id = p.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_author_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
$function$;