-- Group post replies and literary reactions. Access is through membership-scoped RPCs.
CREATE TABLE IF NOT EXISTS public.reading_group_post_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 post_id uuid NOT NULL REFERENCES public.reading_group_posts(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(char_length(btrim(body)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reading_group_post_comments_post_created_idx ON public.reading_group_post_comments(post_id,created_at);
CREATE TABLE IF NOT EXISTS public.reading_group_post_reactions (
 post_id uuid NOT NULL REFERENCES public.reading_group_posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 reaction text NOT NULL CHECK(reaction IN ('loved','insightful','cozy','thought_provoking','unputdownable')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(post_id,user_id)
);
ALTER TABLE public.reading_group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_group_post_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.reading_group_post_comments FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.reading_group_post_reactions FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.list_reading_group_post_comments(p_post_id uuid,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,post_id uuid,author_id uuid,author_name text,body text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_actor uuid:=auth.uid(); v_group uuid;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 SELECT p.group_id INTO v_group FROM public.reading_group_posts p WHERE p.id=p_post_id;
 IF v_group IS NULL OR NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_group AND m.user_id=v_actor AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT c.id,c.post_id,c.author_id,COALESCE(pr.full_name,pr.name,'Reader'),c.body,c.created_at
 FROM public.reading_group_post_comments c LEFT JOIN public.profiles pr ON pr.id=c.author_id
 WHERE c.post_id=p_post_id ORDER BY c.created_at ASC LIMIT LEAST(GREATEST(COALESCE(p_limit,50),1),100);
END; $$;

CREATE OR REPLACE FUNCTION public.create_reading_group_post_comment(p_post_id uuid,p_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_actor uuid:=auth.uid(); v_group uuid; v_id uuid;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 SELECT p.group_id INTO v_group FROM public.reading_group_posts p WHERE p.id=p_post_id;
 IF v_group IS NULL OR NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_group AND m.user_id=v_actor AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
 END IF;
 IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Reply must be 1–2000 characters' USING ERRCODE='22023'; END IF;
 INSERT INTO public.reading_group_post_comments(post_id,author_id,body) VALUES(p_post_id,v_actor,btrim(p_body)) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.toggle_reading_group_post_reaction(p_post_id uuid,p_reaction text)
RETURNS TABLE(reaction text,active boolean,total integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_actor uuid:=auth.uid(); v_group uuid; v_active boolean;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 IF p_reaction NOT IN ('loved','insightful','cozy','thought_provoking','unputdownable') THEN RAISE EXCEPTION 'Invalid reaction' USING ERRCODE='22023'; END IF;
 SELECT p.group_id INTO v_group FROM public.reading_group_posts p WHERE p.id=p_post_id;
 IF v_group IS NULL OR NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_group AND m.user_id=v_actor AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required' USING ERRCODE='42501';
 END IF;
 DELETE FROM public.reading_group_post_reactions WHERE post_id=p_post_id AND user_id=v_actor AND reading_group_post_reactions.reaction=p_reaction;
 IF FOUND THEN v_active:=false; ELSE
  INSERT INTO public.reading_group_post_reactions(post_id,user_id,reaction) VALUES(p_post_id,v_actor,p_reaction)
  ON CONFLICT(post_id,user_id) DO UPDATE SET reaction=EXCLUDED.reaction,created_at=now();
  v_active:=true;
 END IF;
 RETURN QUERY SELECT p_reaction,v_active,(SELECT count(*)::integer FROM public.reading_group_post_reactions r WHERE r.post_id=p_post_id AND r.reaction=p_reaction);
END; $$;

REVOKE ALL ON FUNCTION public.list_reading_group_post_comments(uuid,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.create_reading_group_post_comment(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.toggle_reading_group_post_reaction(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_reading_group_post_comments(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reading_group_post_comment(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_reading_group_post_reaction(uuid,text) TO authenticated;
