-- Run as the database owner; all fixtures are rolled back.
BEGIN;
INSERT INTO public.content_feedback (id, user_id, feedback_type, comment, created_at) VALUES
('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000201','sequel_vote','{"bookId":"00000000-0000-4000-8000-000000000301","vote":"yes"}',now()-interval '1 minute'),
('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000201','sequel_vote','{"bookId":"00000000-0000-4000-8000-000000000301","vote":"no"}',now()),
('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000202','sequel_vote','{"bookId":"00000000-0000-4000-8000-000000000301","vote":"yes"}',now());
DO $$
DECLARE counts record;
BEGIN
  SELECT * INTO counts FROM public.get_sequel_vote_counts('00000000-0000-4000-8000-000000000301');
  IF counts.yes_count <> 1 OR counts.no_count <> 1 THEN
    RAISE EXCEPTION 'Expected the latest vote from each reader: one yes and one no';
  END IF;
END;
$$;
ROLLBACK;