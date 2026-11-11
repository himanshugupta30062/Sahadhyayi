-- Reactions for Reading Group discussions (authenticated, active members only).
CREATE TABLE IF NOT EXISTS public.group_reading_discussion_reactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 discussion_id uuid NOT NULL REFERENCES public.group_reading_discussions(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 reaction text NOT NULL CHECK (reaction IN ('heart','like','insightful')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(discussion_id,user_id)
);
CREATE INDEX IF NOT EXISTS group_reading_discussion_reactions_discussion_idx
 ON public.group_reading_discussion_reactions(discussion_id,reaction);
ALTER TABLE public.group_reading_discussion_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.group_reading_discussion_reactions FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.list_group_reading_discussion_reactions(p_discussion_id uuid)
RETURNS TABLE(reaction text,count bigint,mine boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_group uuid;
BEGIN
 SELECT d.group_id INTO v_group FROM public.group_reading_discussions d WHERE d.id=p_discussion_id;
 IF v_group IS NULL OR NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_group AND m.user_id=auth.uid() AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required';
 END IF;
 RETURN QUERY SELECT r.reaction,count(*)::bigint,bool_or(r.user_id=auth.uid())
 FROM public.group_reading_discussion_reactions r WHERE r.discussion_id=p_discussion_id GROUP BY r.reaction;
END;$$;

CREATE OR REPLACE FUNCTION public.toggle_group_reading_discussion_reaction(p_discussion_id uuid,p_reaction text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_group uuid; v_existing text;
BEGIN
 IF p_reaction NOT IN ('heart','like','insightful') THEN RAISE EXCEPTION 'Unsupported reaction'; END IF;
 SELECT d.group_id INTO v_group FROM public.group_reading_discussions d WHERE d.id=p_discussion_id;
 IF v_group IS NULL OR NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_group AND m.user_id=auth.uid() AND m.status='active') THEN
  RAISE EXCEPTION 'Active group membership required';
 END IF;
 SELECT r.reaction INTO v_existing FROM public.group_reading_discussion_reactions r WHERE r.discussion_id=p_discussion_id AND r.user_id=auth.uid();
 IF v_existing=p_reaction THEN DELETE FROM public.group_reading_discussion_reactions WHERE discussion_id=p_discussion_id AND user_id=auth.uid(); RETURN false; END IF;
 INSERT INTO public.group_reading_discussion_reactions(discussion_id,user_id,reaction) VALUES(p_discussion_id,auth.uid(),p_reaction)
 ON CONFLICT(discussion_id,user_id) DO UPDATE SET reaction=excluded.reaction,created_at=now();
 RETURN true;
END;$$;
REVOKE ALL ON FUNCTION public.list_group_reading_discussion_reactions(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.toggle_group_reading_discussion_reaction(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_group_reading_discussion_reactions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_group_reading_discussion_reaction(uuid,text) TO authenticated;
