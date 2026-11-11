-- A digest notification is an output, not activity; prevent yesterday's digest from
-- being counted as an item in the next daily digest.
CREATE OR REPLACE FUNCTION public.dispatch_reading_group_daily_digest()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE v_count integer:=0;
BEGIN
 WITH eligible AS (
  SELECT n.user_id,count(*)::integer AS activity_count,
    (array_agg(DISTINCT coalesce(nullif(n.title,''),'Group activity')))[1:3] AS samples
  FROM public.notifications n JOIN public.reading_group_notification_preferences pref ON pref.user_id=n.user_id
  WHERE n.created_at>=now()-interval '24 hours' AND n.created_at<now()-interval '15 minutes'
    AND n.type LIKE 'reading_group%' AND n.type <> 'reading_group_digest'
    AND coalesce(pref.enabled,true) AND coalesce(pref.digest_enabled,false)
    AND (
      coalesce(pref.quiet_hours_enabled,false)=false OR NOT (
        CASE
          WHEN pref.quiet_hours_start < pref.quiet_hours_end THEN
            (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time >= pref.quiet_hours_start
            AND (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time < pref.quiet_hours_end
          ELSE
            (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time >= pref.quiet_hours_start
            OR (now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::time < pref.quiet_hours_end
        END
      )
    )
    AND NOT EXISTS(SELECT 1 FROM public.reading_group_digest_deliveries d WHERE d.user_id=n.user_id
      AND d.digest_date=(now() AT TIME ZONE coalesce(nullif(pref.timezone,''),'Asia/Kolkata'))::date)
  GROUP BY n.user_id
 ), inserted AS (
  INSERT INTO public.reading_group_digest_deliveries(user_id,digest_date)
  SELECT e.user_id,(now() AT TIME ZONE coalesce(nullif(p.timezone,''),'Asia/Kolkata'))::date
  FROM eligible e JOIN public.reading_group_notification_preferences p ON p.user_id=e.user_id
  ON CONFLICT DO NOTHING RETURNING user_id,digest_date
 ), sent AS (
  INSERT INTO public.notifications(user_id,author_id,actor_id,type,title,message,read,entity_type,entity_id,link)
  SELECT i.user_id,NULL,NULL,'reading_group_digest','Your Reading Groups daily digest',
    e.activity_count||' group updates in the last 24 hours'||CASE WHEN cardinality(e.samples)>0 THEN ': '||array_to_string(e.samples,' • ') ELSE '' END,
    false,'reading_group_digest',i.digest_date::text,'/social?tab=groups'
  FROM inserted i JOIN eligible e ON e.user_id=i.user_id
  RETURNING id,user_id,entity_id
 )
 UPDATE public.reading_group_digest_deliveries d SET notification_id=s.id
 FROM sent s WHERE d.user_id=s.user_id AND d.digest_date=s.entity_id::date;
 GET DIAGNOSTICS v_count=ROW_COUNT; RETURN v_count;
END;
$function$;
REVOKE ALL ON FUNCTION public.dispatch_reading_group_daily_digest() FROM PUBLIC,anon,authenticated;
