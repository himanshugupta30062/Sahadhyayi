-- Pin/unpin group posts as announcements; only active moderators may manage pins.
CREATE OR REPLACE FUNCTION public.set_reading_group_post_pin(p_post_id uuid,p_pin boolean)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_actor uuid:=auth.uid(); v_group uuid; v_pinned timestamptz;
BEGIN
 IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 SELECT p.group_id INTO v_group FROM public.reading_group_posts p WHERE p.id=p_post_id FOR UPDATE;
 IF v_group IS NULL THEN RAISE EXCEPTION 'Post not found' USING ERRCODE='P0002'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=v_group AND m.user_id=v_actor AND m.status='active' AND m.role IN ('owner','admin','moderator')) THEN
  RAISE EXCEPTION 'Group moderator permission required' USING ERRCODE='42501';
 END IF;
 UPDATE public.reading_group_posts SET pinned_at=CASE WHEN p_pin THEN now() ELSE NULL END,updated_at=now()
 WHERE id=p_post_id RETURNING pinned_at INTO v_pinned;
 RETURN v_pinned;
END; $$;
REVOKE ALL ON FUNCTION public.set_reading_group_post_pin(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_reading_group_post_pin(uuid,boolean) TO authenticated;
