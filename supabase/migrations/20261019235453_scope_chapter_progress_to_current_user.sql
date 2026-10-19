
-- A caller may only inspect their own chapter progress, irrespective of the supplied user id.
CREATE OR REPLACE FUNCTION public.user_chapter_progress(_user uuid, _book uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(MAX(drp.chapter_number), 0)
  FROM public.detailed_reading_progress AS drp
  WHERE drp.user_id = auth.uid()
    AND drp.book_id = _book
    AND drp.completion_percentage >= 100;
$function$;
