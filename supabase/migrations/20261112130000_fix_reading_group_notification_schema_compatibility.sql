-- Production notifications table stores only the core notification fields.
-- Keep Reading Group reminders/digests compatible with that schema (no entity_type/entity_id/link).
CREATE OR REPLACE FUNCTION public.dispatch_reading_group_event_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_count integer:=0;
BEGIN
 WITH due AS (
  SELECT e.id event_id,e.group_id,e.title,e.organizer_id,p.user_id,reminder.kind
  FROM public.group_events e
  JOIN public.group_event_participants p ON p.event_id=e.id AND p.response='going'
  JOIN public.group_chat_members m ON m.group_id=e.group_id AND m.user_id=p.user_id AND m.status='active'
  LEFT JOIN public.reading_group_notification_preferences pref ON pref.user_id=p.user_id
  LEFT JOIN public.reading_group_notification_mutes mute ON mute.user_id=p.user_id AND mute.group_id=e.group_id
  CROSS JOIN LATERAL (VALUES ('24h'::text,e.starts_at-interval '24 hours'),('1h'::text,e.starts_at-interval '1 hour')) reminder(kind,due_at)
  WHERE e.status='scheduled' AND e.starts_at>now() AND coalesce(pref.enabled,true) AND coalesce(pref.event_reminders,true)
   AND (mute.user_id IS NULL OR (mute.muted_until IS NOT NULL AND mute.muted_until<=now()))
   AND reminder.due_at<=now() AND reminder.due_at>now()-interval '10 minutes'
   AND (coalesce(pref.quiet_hours_enabled,false)=false OR NOT (
    CASE WHEN pref.quiet_hours_start<pref.quiet_hours_end THEN
     (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time>=pref.quiet_hours_start AND
     (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time<pref.quiet_hours_end
    ELSE (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time>=pref.quiet_hours_start OR
     (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time<pref.quiet_hours_end END))
   AND NOT EXISTS(SELECT 1 FROM public.group_event_reminder_deliveries d WHERE d.event_id=e.id AND d.user_id=p.user_id AND d.reminder_kind=reminder.kind)
 ), inserted AS (
  INSERT INTO public.group_event_reminder_deliveries(event_id,user_id,reminder_kind)
  SELECT event_id,user_id,kind FROM due ON CONFLICT DO NOTHING RETURNING event_id,user_id,reminder_kind
 )
 INSERT INTO public.notifications(user_id,author_id,actor_id,type,title,message,read)
 SELECT i.user_id,e.organizer_id,e.organizer_id,'reading_group_event_reminder',
  CASE i.reminder_kind WHEN '24h' THEN 'Reading group event tomorrow' ELSE 'Reading group event in 1 hour' END,
  e.title||' • Group event',false FROM inserted i JOIN public.group_events e ON e.id=i.event_id;
 GET DIAGNOSTICS v_count=ROW_COUNT; RETURN v_count;
END;$function$;
REVOKE ALL ON FUNCTION public.dispatch_reading_group_event_reminders() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.dispatch_reading_group_daily_digest()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_count integer:=0;
BEGIN
 WITH eligible AS (
  SELECT n.user_id,count(*)::integer activity_count,(array_agg(DISTINCT coalesce(nullif(n.title,''),'Group activity')))[1:3] samples
  FROM public.notifications n JOIN public.reading_group_notification_preferences pref ON pref.user_id=n.user_id
  WHERE n.created_at>=now()-interval '24 hours' AND n.created_at<now()-interval '15 minutes'
   AND n.type LIKE 'reading_group%' AND coalesce(pref.enabled,true) AND coalesce(pref.digest_enabled,false)
   AND NOT EXISTS(SELECT 1 FROM public.reading_group_digest_deliveries d WHERE d.user_id=n.user_id AND d.digest_date=(now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::date)
  GROUP BY n.user_id
 ), inserted AS (
  INSERT INTO public.reading_group_digest_deliveries(user_id,digest_date)
  SELECT e.user_id,(now() AT TIME ZONE coalesce(nullif(p.timezone,''),'Asia/Kolkata'))::date
  FROM eligible e JOIN public.reading_group_notification_preferences p ON p.user_id=e.user_id
  ON CONFLICT DO NOTHING RETURNING user_id,digest_date
 ), sent AS (
  INSERT INTO public.notifications(user_id,type,title,message,read)
  SELECT i.user_id,'reading_group_digest','Your Reading Groups daily digest',
   e.activity_count||' group updates in the last 24 hours'||CASE WHEN cardinality(e.samples)>0 THEN ': '||array_to_string(e.samples,' • ') ELSE '' END,false
  FROM inserted i JOIN eligible e ON e.user_id=i.user_id RETURNING id,user_id
 )
 UPDATE public.reading_group_digest_deliveries d SET notification_id=s.id
 FROM sent s WHERE d.user_id=s.user_id AND d.digest_date=(now() AT TIME ZONE 'Asia/Kolkata')::date;
 GET DIAGNOSTICS v_count=ROW_COUNT; RETURN v_count;
END;$function$;
REVOKE ALL ON FUNCTION public.dispatch_reading_group_daily_digest() FROM PUBLIC,anon,authenticated;
