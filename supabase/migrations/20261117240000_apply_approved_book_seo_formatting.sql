-- Apply only explicitly approved, evidence-backed whitespace cleanup suggestions.
-- Factual metadata changes remain a manual workflow and are never inferred here.
ALTER TABLE public.book_seo_review_decisions
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS applied_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS applied_changes jsonb;

DROP POLICY IF EXISTS "Admins can update book SEO review decisions" ON public.book_seo_review_decisions;
CREATE POLICY "Admins can update unapplied book SEO review decisions"
  ON public.book_seo_review_decisions FOR UPDATE TO authenticated
  USING (public.is_admin() AND applied_at IS NULL)
  WITH CHECK (public.is_admin() AND reviewer_id = auth.uid() AND applied_at IS NULL);

CREATE OR REPLACE FUNCTION public.admin_apply_book_seo_review_decision(p_decision_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_decision public.book_seo_review_decisions%ROWTYPE;
  v_book public.books_library%ROWTYPE;
  v_change jsonb;
  v_field text;
  v_current text;
  v_proposed text;
  v_changes jsonb := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator permission required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_decision
  FROM public.book_seo_review_decisions
  WHERE id = p_decision_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review decision not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_decision.decision <> 'approved' OR v_decision.evidence_url IS NULL
     OR v_decision.evidence_url !~* '^https?://' THEN
    RAISE EXCEPTION 'An approved decision with source evidence is required' USING ERRCODE = '22023';
  END IF;
  IF v_decision.applied_at IS NOT NULL THEN
    RAISE EXCEPTION 'This review decision has already been applied' USING ERRCODE = '55000';
  END IF;
  IF jsonb_typeof(v_decision.review_payload->'suggestedChanges') <> 'array' THEN
    RAISE EXCEPTION 'No supported formatting suggestions were found in this review' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_book
  FROM public.books_library
  WHERE id = v_decision.book_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book no longer exists' USING ERRCODE = 'P0002';
  END IF;

  FOR v_change IN
    SELECT value FROM jsonb_array_elements(v_decision.review_payload->'suggestedChanges')
  LOOP
    v_field := v_change->>'field';
    v_proposed := v_change->>'proposedValue';

    IF coalesce((v_change->>'requiresHumanApproval')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Every proposed change must explicitly require human approval' USING ERRCODE = '22023';
    END IF;
    IF v_field NOT IN ('title', 'author', 'genre', 'language', 'isbn') THEN
      RAISE EXCEPTION 'Unsupported book field in review payload' USING ERRCODE = '22023';
    END IF;

    v_current := CASE v_field
      WHEN 'title' THEN v_book.title
      WHEN 'author' THEN v_book.author
      WHEN 'genre' THEN v_book.genre
      WHEN 'language' THEN v_book.language
      WHEN 'isbn' THEN v_book.isbn
    END;

    IF v_current IS NULL OR v_current IS DISTINCT FROM (v_change->>'currentValue') THEN
      RAISE EXCEPTION 'Book field % changed since the audit; rerun the audit before applying', v_field USING ERRCODE = '40001';
    END IF;
    IF v_proposed IS NULL
       OR v_proposed IS DISTINCT FROM regexp_replace(v_current, '^[[:space:]]+|[[:space:]]+$', '', 'g')
       OR v_proposed = v_current THEN
      RAISE EXCEPTION 'Only exact leading/trailing whitespace cleanup is allowed for %', v_field USING ERRCODE = '22023';
    END IF;
    IF v_changes ? v_field THEN
      RAISE EXCEPTION 'Duplicate field suggestion in review payload: %', v_field USING ERRCODE = '22023';
    END IF;

    v_changes := v_changes || jsonb_build_object(v_field, v_proposed);
  END LOOP;

  IF v_changes = '{}'::jsonb THEN
    RAISE EXCEPTION 'There are no formatting corrections to apply' USING ERRCODE = '22023';
  END IF;

  UPDATE public.books_library
  SET
    title = CASE WHEN v_changes ? 'title' THEN v_changes->>'title' ELSE title END,
    author = CASE WHEN v_changes ? 'author' THEN v_changes->>'author' ELSE author END,
    genre = CASE WHEN v_changes ? 'genre' THEN v_changes->>'genre' ELSE genre END,
    language = CASE WHEN v_changes ? 'language' THEN v_changes->>'language' ELSE language END,
    isbn = CASE WHEN v_changes ? 'isbn' THEN v_changes->>'isbn' ELSE isbn END,
    updated_at = now()
  WHERE id = v_decision.book_id;

  UPDATE public.book_seo_review_decisions
  SET applied_at = now(),
      applied_by = auth.uid(),
      applied_changes = v_changes,
      updated_at = now()
  WHERE id = v_decision.id;

  RETURN jsonb_build_object(
    'success', true,
    'book_id', v_decision.book_id,
    'decision_id', v_decision.id,
    'applied_changes', v_changes,
    'applied_at', now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_apply_book_seo_review_decision(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_apply_book_seo_review_decision(uuid) TO authenticated;
