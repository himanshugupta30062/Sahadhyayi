-- Reading Groups: notification preference storage (delivery remains a separate rollout).
-- Requires the Reading Groups lifecycle migration that adds group_chat_members.status.

CREATE TABLE IF NOT EXISTS public.reading_group_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  event_reminders boolean NOT NULL DEFAULT true,
  discussion_activity boolean NOT NULL DEFAULT true,
  membership_activity boolean NOT NULL DEFAULT true,
  digest_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reading_group_notification_preferences_quiet_hours_check
    CHECK (
      (quiet_hours_enabled = false)
      OR (quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL)
    )
);

COMMENT ON TABLE public.reading_group_notification_preferences IS
  'Per-reader Reading Groups notification settings. No delivery is performed by this table.';

CREATE TABLE IF NOT EXISTS public.reading_group_notification_mutes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  muted_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

COMMENT ON TABLE public.reading_group_notification_mutes IS
  'Per-reader mute overrides for individual Reading Groups; NULL muted_until means indefinitely.';

ALTER TABLE public.reading_group_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_group_notification_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Readers manage own group notification preferences"
  ON public.reading_group_notification_preferences;
CREATE POLICY "Readers manage own group notification preferences"
  ON public.reading_group_notification_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Readers view own active group notification mutes"
  ON public.reading_group_notification_mutes;
CREATE POLICY "Readers view own active group notification mutes"
  ON public.reading_group_notification_mutes
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_chat_members m
      WHERE m.group_id = reading_group_notification_mutes.group_id
        AND m.user_id = (SELECT auth.uid())
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Readers manage own active group notification mutes"
  ON public.reading_group_notification_mutes;
CREATE POLICY "Readers manage own active group notification mutes"
  ON public.reading_group_notification_mutes
  FOR ALL TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_chat_members m
      WHERE m.group_id = reading_group_notification_mutes.group_id
        AND m.user_id = (SELECT auth.uid())
        AND m.status = 'active'
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_chat_members m
      WHERE m.group_id = reading_group_notification_mutes.group_id
        AND m.user_id = (SELECT auth.uid())
        AND m.status = 'active'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.reading_group_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.reading_group_notification_mutes TO authenticated;
REVOKE ALL ON public.reading_group_notification_preferences FROM anon;
REVOKE ALL ON public.reading_group_notification_mutes FROM anon;

