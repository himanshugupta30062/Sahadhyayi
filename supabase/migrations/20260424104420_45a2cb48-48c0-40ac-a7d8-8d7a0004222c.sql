ALTER TABLE public.content_feedback DROP CONSTRAINT IF EXISTS content_feedback_feedback_type_check;

ALTER TABLE public.content_feedback ADD CONSTRAINT content_feedback_feedback_type_check
CHECK (feedback_type = ANY (ARRAY['like'::text, 'dislike'::text, 'suggestion'::text, 'idea'::text, 'issue'::text, 'improvement'::text, 'reader_comment'::text, 'reader_quote'::text]));