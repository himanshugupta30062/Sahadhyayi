-- Ensure every reader is attached to the shared welcome reading circle on signup.
-- Safe to re-run: deduplicates legacy rows and uses a unique membership key.

DELETE FROM public.group_members a
USING public.group_members b
WHERE a.group_id = b.group_id
  AND a.user_id = b.user_id
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_user_unique
  ON public.group_members (group_id, user_id);

CREATE OR REPLACE FUNCTION public.join_default_reading_community()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT g.id
    INTO v_group_id
    FROM public.groups g
   WHERE g.name = 'Sahadhyayi Community Reading Circle'
   ORDER BY g.created_at ASC
   LIMIT 1;

  IF v_group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (v_group_id, NEW.id)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_join_default_reading_community ON auth.users;
CREATE TRIGGER on_auth_user_join_default_reading_community
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.join_default_reading_community();

INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, u.id
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT id
  FROM public.groups
  WHERE name = 'Sahadhyayi Community Reading Circle'
  ORDER BY created_at ASC
  LIMIT 1
) g
ON CONFLICT (group_id, user_id) DO NOTHING;

-- All signed-in readers must be able to discover the shared reading group.
DROP POLICY IF EXISTS "Users can view groups they created" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can view reading groups" ON public.groups;
CREATE POLICY "Authenticated users can view reading groups"
ON public.groups
FOR SELECT
TO authenticated
USING (true);
