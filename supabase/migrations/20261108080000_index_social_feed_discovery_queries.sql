-- Support the For You feed's book and author filters without changing visibility.
-- Row-level security on public.posts remains the authoritative audience boundary.
CREATE INDEX IF NOT EXISTS idx_posts_user_feed_order
  ON public.posts (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_posts_book_feed_order
  ON public.posts (book_id, created_at DESC, id DESC)
  WHERE book_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_bookshelf_for_you_signal
  ON public.user_bookshelf (user_id, status, added_at DESC, book_id);
