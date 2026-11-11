-- Respect global Reading Groups preferences and group mutes for event + RSVP alerts.
-- Event announcements and RSVP activity use membership_activity; reminders use event_reminders.
CREATE OR REPLACE FUNCTION public.notify_reading_group_event_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_group uuid;
  v_actor uuid;
  v_recipient uuid;
  v_event uuid;
  v_title text;
  v_message text;
  v_link text;
BEGIN
  IF TG_TABLE_NAME = 'group_events' AND TG_OP = 'INSERT' THEN
    v_group := NEW.group_id;
    v_actor := NEW.organizer_id;
    v_event := NEW.id;
    v_title := 'New reading group event';
    v_message := left(NEW.title, 140);
    v_link := '/groups/' || v_group::text || '#group-events';

    INSERT INTO public.notifications
      (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
    SELECT member.user_id, v_actor, 'reading_group_event', v_title, v_message,
           false, 'group_event', v_event, v_link
    FROM public.group_chat_members member
    LEFT JOIN public.reading_group_notification_preferences pref
      ON pref.user_id = member.user_id
    WHERE member.group_id = v_group
      AND member.status = 'active'
      AND member.user_id <> v_actor
      AND coalesce(pref.enabled, true)
      AND coalesce(pref.membership_activity, true)
      AND NOT public.reading_group_notifications_muted(member.user_id, v_group)
    ON CONFLICT DO NOTHING;

  ELSIF TG_TABLE_NAME = 'group_event_participants' AND TG_OP = 'INSERT' THEN
    v_event := NEW.event_id;
    v_actor := NEW.user_id;

    SELECT event.group_id, event.organizer_id, event.title
      INTO v_group, v_recipient, v_title
    FROM public.group_events event
    WHERE event.id = v_event AND event.status = 'scheduled';

    IF v_recipient IS NOT NULL
       AND v_recipient <> v_actor
       AND coalesce((
         SELECT pref.enabled AND pref.membership_activity
         FROM public.reading_group_notification_preferences pref
         WHERE pref.user_id = v_recipient
       ), true)
       AND NOT public.reading_group_notifications_muted(v_recipient, v_group) THEN
      v_message := 'A member responded "' || NEW.response || '" to "' || left(v_title, 100) || '".';
      v_link := '/groups/' || v_group::text || '#group-events';

      INSERT INTO public.notifications
        (user_id, actor_id, type, title, message, read, entity_type, entity_id, link)
      VALUES
        (v_recipient, v_actor, 'reading_group_event_rsvp', 'New event RSVP',
         v_message, false, 'group_event', v_event, v_link)
      ON CONFLICT DO NOTHING;
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_reading_group_event_activity() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.notify_reading_group_event_activity() IS
  'Creates in-app event and RSVP notifications, respecting global membership activity preference and per-group mute. Event reminders are dispatched separately.';
