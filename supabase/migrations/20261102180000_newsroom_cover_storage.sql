-- Newsroom cover images: public reads, restricted editorial uploads/deletes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('news-covers', 'news-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "News covers are publicly readable" ON storage.objects;
CREATE POLICY "News covers are publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'news-covers');

DROP POLICY IF EXISTS "Authorized editors upload news covers" ON storage.objects;
CREATE POLICY "Authorized editors upload news covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'news-covers'
    AND ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.publish')) OR (SELECT public.has_permission('content.edit')))
);

DROP POLICY IF EXISTS "Authorized editors update news covers" ON storage.objects;
CREATE POLICY "Authorized editors update news covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'news-covers'
    AND ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.publish')) OR (SELECT public.has_permission('content.edit')))
  )
  WITH CHECK (
    bucket_id = 'news-covers'
    AND ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.publish')) OR (SELECT public.has_permission('content.edit')))
);

DROP POLICY IF EXISTS "Authorized editors delete news covers" ON storage.objects;
CREATE POLICY "Authorized editors delete news covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'news-covers'
    AND ((SELECT public.is_admin()) OR (SELECT public.has_permission('content.publish')) OR (SELECT public.has_permission('content.edit')))
  );
