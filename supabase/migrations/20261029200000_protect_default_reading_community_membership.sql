-- Enforce permanent membership in the shared default community across active and legacy group systems.

CREATE OR REPLACE FUNCTION public.join_default_reading_community()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_legacy_group_id uuid;
  v_chat_group_id uuid;
BEGIN
  SELECT g.id INTO v_legacy_group_id
  FROM public.groups g
  WHERE g.name = 'Sahadhyayi Community Reading Circle'
  ORDER BY g.created_at ASC
  LIMIT 1;

  IF v_legacy_group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (v_legacy_group_id, NEW.id)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  SELECT g.id INTO v_chat_group_id
  FROM public.group_chats g
  WHERE g.name = 'Sahadhyayi Community Reading Circle'
  ORDER BY g.created_at ASC
  LIMIT 1;

  IF v_chat_group_id IS NOT NULL THEN
    INSERT INTO public.group_chat_members (group_id, user_id, role)
    VALUES (v_chat_group_id, NEW.id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

INSERT INTO public.group_chat_members (group_id, user_id, role)
SELECT default_group.id, users.id, 'member'
FROM auth.users AS users
CROSS JOIN LATERAL (
  SELECT id
  FROM public.group_chats
  WHERE name = 'Sahadhyayi Community Reading Circle'
  ORDER BY created_at ASC
  LIMIT 1
) AS default_group
ON CONFLICT (group_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.protect_default_reading_community_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_default_group_id uuid;
BEGIN
  SELECT id INTO v_default_group_id
  FROM public.group_chats
  WHERE name = 'Sahadhyayi Community Reading Circle'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_default_group_id IS NOT NULL AND OLD.group_id = v_default_group_id THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'You cannot leave the Sahadhyayi Community Reading Circle.'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE'
       AND (NEW.group_id IS DISTINCT FROM OLD.group_id
            OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
      RAISE EXCEPTION 'Membership in the Sahadhyayi Community Reading Circle cannot be changed.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_default_reading_community_membership ON public.group_chat_members;
CREATE TRIGGER protect_default_reading_community_membership
BEFORE DELETE OR UPDATE ON public.group_chat_members
FOR EACH ROW EXECUTE FUNCTION public.protect_default_reading_community_membership();

CREATE OR REPLACE FUNCTION public.protect_default_reading_community_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_default_group_id uuid;
BEGIN
  SELECT id INTO v_default_group_id
  FROM public.group_chats
  WHERE name = 'Sahadhyayi Community Reading Circle'
  ORDER BY created_at ASC
  LIMIT 1;

  IF OLD.id = v_default_group_id THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'The Sahadhyayi Community Reading Circle cannot be deleted.'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'The default community group name cannot be changed.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_default_reading_community_group ON public.group_chats;
CREATE TRIGGER protect_default_reading_community_group
BEFORE DELETE OR UPDATE ON public.group_chats
FOR EACH ROW EXECUTE FUNCTION public.protect_default_reading_community_group();
