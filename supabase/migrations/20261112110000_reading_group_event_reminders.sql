-- Reading Groups: idempotent event reminders (in-app only).
-- Runs every five minutes when pg_cron is available. Quiet-hour reminders are deferred
-- by leaving them unclaimed until the next run; a small due window avoids duplicate late sends.
CREATE TABLE IF NOT EXISTS public.group_event_reminder_deliveries (
  event_id uuid NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_kind text NOT NULL CHECK (reminder_kind IN ('24h','1h')),
  delivered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id, reminder_kind)
);
ALTER TABLE public.group_event_reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_event_reminder_deliveries FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.dispatch_reading_group_event_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  WITH due AS (
    SELECT e.id AS event_id, e.group_id, e.title, e.starts_at, e.timezone,
           p.user_id, reminder.kind, pref.quiet_hours_enabled,
           pref.quiet_hours_start, pref.quiet_hours_end, pref.timezone AS pref_timezone
    FROM public.group_events e
    JOIN public.group_event_participants p ON p.event_id = e.id AND p.response = 'going'
    JOIN public.group_chat_members m ON m.group_id = e.group_id AND m.user_id = p.user_id AND m.status = 'active'
    LEFT JOIN public.reading_group_notification_preferences pref ON pref.user_id = p.user_id
    LEFT JOIN public.reading_group_notification_mutes mute ON mute.user_id = p.user_id AND mute.group_id = e.group_id
    CROSS JOIN LATERAL (VALUES
      ('24h'::text, e.starts_at - interval '24 hours'),
      ('1h'::text, e.starts_at - interval '1 hour')
    ) reminder(kind, due_at)
    WHERE e.status = 'scheduled'
      AND e.starts_at > now()
      AND coalesce(pref.enabled, true)
      AND coalesce(pref.event_reminders, true)
      AND (mute.user_id IS NULL OR (mute.muted_until IS NOT NULL AND mute.muted_until <= now()))
      AND reminder.due_at <= now()
      AND reminder.due_at > now() - interval '10 minutes'
      AND (
        coalesce(pref.quiet_hours_enabled, false) = false
        OR NOT (
          CASE
            WHEN pref.quiet_hours_start < pref.quiet_hours_end THEN
              (now() AT TIME ZONE coalesce(nullif(pref.timezone,''), 'Asia/Kolkata'))::time >= pref.quiet_hours_start
              AND (now() AT TIME ZONE coalesce(nullif(pref.timezone,''), 'Asia/Kolkata'))::time < pref.quiet_hours_end
            ELSE
              (now() AT TIME ZONE coalesce(nullif(pref.timezone,''), 'Asia/Kolkata'))::time >= pref.quiet_hours_start
              OR (now() AT TIME ZONE coalesce(nullif(pref.timezone,''), 'Asia/Kolkata'))::time < pref.quiet_hours_end
          END
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.group_event_reminder_deliveries d
        WHERE d.event_id=e.id AND d.user_id=p.user_id AND d.reminder_kind=reminder.kind
      )
  ), inserted AS (
    INSERT INTO public.group_event_reminder_deliveries(event_id,user_id,reminder_kind)
    SELECT event_id,user_id,kind FROM due
    ON CONFLICT DO NOTHING
    RETURNING event_id,user_id,reminder_kind
  ), notifications AS (
    INSERT INTO public.notifications
      (user_id, author_id, actor_id, type, title, message, read, entity_type, entity_id, link)
    SELECT i.user_id, e.organizer_id, e.organizer_id,
      'reading_group_event_reminder',
      CASE i.reminder_kind WHEN '24h' THEN 'Reading group event tomorrow' ELSE 'Reading group event in 1 hour' END,
      e.title, false, 'group_event', e.id, '/groups/' || e.group_id::text
    FROM inserted i JOIN public.group_events e ON e.id=i.event_id
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM notifications;
  RETURN v_count;
END;
$function$;
REVOKE ALL ON FUNCTION public.dispatch_reading_group_event_reminders() FROM PUBLIC, anon, authenticated;

DO $schedule$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='reading-group-event-reminders') THEN
      PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='reading-group-event-reminders';
    END IF;
    PERFORM cron.schedule(
      'reading-group-event-reminders',
      '*/5 * * * *',
      'SELECT public.dispatch_reading_group_event_reminders();'
    );
  END IF;
END;
$schedule$;

COMMENT ON FUNCTION public.dispatch_reading_group_event_reminders() IS
  'Creates deduplicated in-app 24h/1h reminders for going RSVPs, respecting preference, active membership, mutes and quiet hours. pg_cron schedules every 5 minutes when installed.';
