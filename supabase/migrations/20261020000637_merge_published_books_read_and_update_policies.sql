
ALTER POLICY "Anyone can view approved books" ON public.user_published_books TO anon;
ALTER POLICY "Admins can view all published books" ON public.user_published_books
  USING (
    status = 'approved'::text
    OR has_role((SELECT auth.uid()), 'admin'::text)
    OR user_id = (SELECT auth.uid())
  );
DROP POLICY "Users can view own published books" ON public.user_published_books;
ALTER POLICY "Admins can update all published books" ON public.user_published_books
  USING (
    has_role((SELECT auth.uid()), 'admin'::text)
    OR (user_id = (SELECT auth.uid()) AND status = ANY (ARRAY['draft'::text, 'rejected'::text]))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text)
    OR (user_id = (SELECT auth.uid()) AND status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'rejected'::text]))
  );
DROP POLICY "Users can update own draft/rejected books" ON public.user_published_books;
