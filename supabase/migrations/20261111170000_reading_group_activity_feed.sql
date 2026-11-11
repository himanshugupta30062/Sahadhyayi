-- Reading group activity stream: scoped RPCs only; membership is enforced server-side.
CREATE TABLE IF NOT EXISTS public.reading_group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  book_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
  pinned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reading_group_posts_group_created_idx
  ON public.reading_group_posts(group_id, created_at DESC);
ALTER TABLE public.reading_group_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.reading_group_posts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_reading_group_posts(p_group_id uuid, p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, group_id uuid, author_id uuid, author_name text, author_photo_url text,
  body text, book_id uuid, book_title text, book_cover_url text, pinned_at timestamptz,
  created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_actor uuid := auth.uid();
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.group_chat_members m WHERE m.group_id=p_group_id AND m.user_id=v_actor AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT p.id,p.group_id,p.author_id,COALESCE(pr.full_name,pr.name,'Reader'),pr.profile_photo_url,
  p.body,p.book_id,b.title,b.cover_image_url,p.pinned_at,p.created_at,p.updated_at
 FROM public.reading_group_posts p LEFT JOIN public.profiles pr ON pr.id=p.author_id
 LEFT JOIN public.books_library b ON b.id=p.book_id
 WHERE p.group_id=p_group_id
 ORDER BY (p.pinned_at IS NOT NULL) DESC,p.pinned_at DESC NULLS LAST,p.created_at DESC
 LIMIT LEAST(GREATEST(COALESCE(p_limit,50),1),100);
END; $$;

CREATE OR REPLACE FUNCTION public.create_reading_group_post(p_group_id uuid,p_body text,p_book_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_actor uuid:=auth.uid(); v_id uuid;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=p_group_id AND m.user_id=v_actor AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
 END IF;
 IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'Post must be 1–5000 characters' USING ERRCODE='22023'; END IF;
 IF p_book_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.books_library b WHERE b.id=p_book_id) THEN RAISE EXCEPTION 'Book not found' USING ERRCODE='P0002'; END IF;
 INSERT INTO public.reading_group_posts(group_id,author_id,body,book_id) VALUES(p_group_id,v_actor,btrim(p_body),p_book_id) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_reading_group_post(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_actor uuid:=auth.uid(); v_post public.reading_group_posts;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 SELECT * INTO v_post FROM public.reading_group_posts WHERE id=p_post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Post not found' USING ERRCODE='P0002'; END IF;
 IF v_post.author_id<>v_actor AND NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_post.group_id AND m.user_id=v_actor AND m.status='active' AND m.role IN ('owner','admin','moderator')) THEN
  RAISE EXCEPTION 'Author or group moderator required' USING ERRCODE='42501';
 END IF;
 DELETE FROM public.reading_group_posts WHERE id=p_post_id;
END; $$;

REVOKE ALL ON FUNCTION public.list_reading_group_posts(uuid,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.create_reading_group_post(uuid,text,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.delete_reading_group_post(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_reading_group_posts(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reading_group_post(uuid,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_reading_group_post(uuid) TO authenticated;
