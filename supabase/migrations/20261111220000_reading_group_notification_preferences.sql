-- Per-member reading group notification mute preferences.
CREATE TABLE IF NOT EXISTS public.reading_group_notification_preferences (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
 muted boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,group_id)
);
ALTER TABLE public.reading_group_notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own group notification preferences" ON public.reading_group_notification_preferences;
CREATE POLICY "Users manage own group notification preferences"
 ON public.reading_group_notification_preferences FOR ALL TO authenticated
 USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.reading_group_notification_preferences TO authenticated;
-- Existing group activity/event triggers consult preferences before sending notifications.
CREATE OR REPLACE FUNCTION public.reading_group_notifications_muted(p_user uuid,p_group uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT COALESCE((SELECT pref.muted FROM public.reading_group_notification_preferences pref
 WHERE pref.user_id=p_user AND pref.group_id=p_group),false) $$;
REVOKE ALL ON FUNCTION public.reading_group_notifications_muted(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reading_group_notifications_muted(uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
