-- 1) Allow all version types used by the UI
ALTER TABLE public.user_generated_content
  DROP CONSTRAINT IF EXISTS user_generated_content_content_type_check;

ALTER TABLE public.user_generated_content
  ADD CONSTRAINT user_generated_content_content_type_check
  CHECK (content_type = ANY (ARRAY[
    'alternative_chapter','alternative_ending','continuation',
    'summary','alternate_ending','chapter','complete_rewrite'
  ]));

-- 2) Drop the FK that forces book_id to live in `books`
--    (BookDetails uses books_library IDs)
ALTER TABLE public.user_generated_content
  DROP CONSTRAINT IF EXISTS user_generated_content_book_id_fkey;

-- 3) Drop the FK on content_votes since it can point to either
--    user_generated_content OR content_feedback rows.
ALTER TABLE public.content_votes
  DROP CONSTRAINT IF EXISTS content_votes_content_id_fkey;

-- 4) Replace UNIQUE(user_id, content_id) with UNIQUE(user_id, content_id, vote_type)
ALTER TABLE public.content_votes
  DROP CONSTRAINT IF EXISTS content_votes_user_id_content_id_key;

ALTER TABLE public.content_votes
  ADD CONSTRAINT content_votes_user_content_vote_key
  UNIQUE (user_id, content_id, vote_type);