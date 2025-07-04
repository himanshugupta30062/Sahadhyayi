-- Add indexes for better performance on frequently queried columns

-- User books foreign keys
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON public.user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON public.user_books(book_id);

-- Group members foreign keys
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- Stories table
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);

-- Reading progress
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);

-- Reading summaries
CREATE INDEX IF NOT EXISTS idx_reading_summaries_user_id ON public.reading_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_summaries_book_id ON public.reading_summaries(book_id);

-- User generated content
CREATE INDEX IF NOT EXISTS idx_user_generated_content_user_id ON public.user_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_user_generated_content_book_id ON public.user_generated_content(book_id);

-- Content feedback
CREATE INDEX IF NOT EXISTS idx_content_feedback_user_id ON public.content_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_content_feedback_content_id ON public.content_feedback(content_id);

-- Content votes
CREATE INDEX IF NOT EXISTS idx_content_votes_user_id ON public.content_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_votes_content_id ON public.content_votes(content_id);

-- Content comments
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON public.content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON public.content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent_comment_id ON public.content_comments(parent_comment_id);

-- Detailed reading progress
CREATE INDEX IF NOT EXISTS idx_detailed_reading_progress_user_id ON public.detailed_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_detailed_reading_progress_book_id ON public.detailed_reading_progress(book_id);

-- Book summaries
CREATE INDEX IF NOT EXISTS idx_book_summaries_book_id ON public.book_summaries(book_id);

-- Books library indexes for filtering and ordering
CREATE INDEX IF NOT EXISTS idx_books_library_created_at ON public.books_library(created_at);
CREATE INDEX IF NOT EXISTS idx_books_library_genre ON public.books_library(genre);
CREATE INDEX IF NOT EXISTS idx_books_library_language ON public.books_library(language);
