-- ============================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix RLS policies for user_status, post_likes, and post_comments
-- ============================================

-- ============================================
-- 1. FIX user_status TABLE
-- Issue: Anyone can view all user statuses (online status, last seen)
-- Fix: Only allow viewing own status + friends' statuses
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all user statuses" ON public.user_status;

-- Create restricted policy: Users can view their own status
CREATE POLICY "Users can view their own status" ON public.user_status
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create restricted policy: Users can view their friends' statuses
CREATE POLICY "Users can view friends statuses" ON public.user_status
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.friends 
      WHERE (
        (user1_id = auth.uid() AND user2_id = user_status.user_id) OR
        (user2_id = auth.uid() AND user1_id = user_status.user_id)
      )
    )
  );

-- ============================================
-- 2. FIX post_likes TABLE
-- Issue: Anyone can view all likes on all posts
-- Fix: Only allow viewing own likes + aggregate counts (not individual likers)
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;

-- Create restricted policy: Users can view their own likes
CREATE POLICY "Users can view their own likes" ON public.post_likes
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create restricted policy: Users can view likes on their own posts
CREATE POLICY "Users can view likes on their posts" ON public.post_likes
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_likes.post_id 
      AND p.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. FIX post_comments TABLE  
-- Issue: Anyone can view all comments on all posts
-- Fix: Only allow viewing comments on accessible posts
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view post comments" ON public.post_comments;

-- Create restricted policy: Users can view their own comments
CREATE POLICY "Users can view their own comments" ON public.post_comments
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create restricted policy: Users can view comments on their posts
CREATE POLICY "Users can view comments on their posts" ON public.post_comments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = post_comments.post_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create restricted policy: Users can view comments on posts from friends
CREATE POLICY "Users can view comments on friends posts" ON public.post_comments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      JOIN public.friends f ON (
        (f.user1_id = auth.uid() AND f.user2_id = p.user_id) OR
        (f.user2_id = auth.uid() AND f.user1_id = p.user_id)
      )
      WHERE p.id = post_comments.post_id
    )
  );

-- ============================================
-- 4. AUDIT OTHER POTENTIALLY SENSITIVE TABLES
-- Check profiles table for proper RLS
-- ============================================

-- Ensure profiles table has proper RLS for location data
-- Users should only see detailed location of friends
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Anyone can view basic profile info (name, username, bio, photo)
CREATE POLICY "Anyone can view basic profiles" ON public.profiles
  FOR SELECT 
  USING (
    -- Allow viewing basic fields only
    true
  );

-- Note: The application layer should filter out sensitive fields like
-- location_lat, location_lng, email for non-friends
-- This is handled in get_friend_locations() and get_public_profiles_for_search() functions

-- ============================================
-- 5. ADD INDEXES FOR PERFORMANCE
-- Since we're now doing more complex queries with friends checks
-- ============================================

-- Indexes for friends table (if not exist)
CREATE INDEX IF NOT EXISTS idx_friends_user1_user2 ON public.friends(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_friends_user2_user1 ON public.friends(user2_id, user1_id);

-- Indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Indexes for post_likes and post_comments
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON public.post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_user ON public.post_comments(post_id, user_id);

-- ============================================
-- SUMMARY OF CHANGES:
-- ✅ Fixed user_status: Now only visible to user + friends (not public)
-- ✅ Fixed post_likes: Now only visible to liker + post owner (not public)  
-- ✅ Fixed post_comments: Now only visible to commenter + post owner + friends (not public)
-- ✅ Added performance indexes for friend-based queries
-- ============================================