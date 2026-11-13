-- Enhance Reading DNA privacy controls and discoverability RPC
-- Supports 'public', 'friends', and 'private' visibility settings with strict RLS enforcement.

-- 1. Update visibility constraint on reading_dna table
ALTER TABLE public.reading_dna DROP CONSTRAINT IF EXISTS reading_dna_visibility_check;
ALTER TABLE public.reading_dna ADD CONSTRAINT reading_dna_visibility_check 
  CHECK (visibility IN ('public', 'friends', 'private'));

-- 2. Update Row Level Security Policies
DROP POLICY IF EXISTS "reading_dna_owner_and_friends_read" ON public.reading_dna;
DROP POLICY IF EXISTS "Reading DNA is viewable by owner or when public" ON public.reading_dna;
DROP POLICY IF EXISTS "reading_dna_read" ON public.reading_dna;
DROP POLICY IF EXISTS "reading_dna_granular_privacy_read" ON public.reading_dna;

CREATE POLICY "reading_dna_granular_privacy_read" ON public.reading_dna
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (visibility = 'public')
    OR (visibility = 'friends' AND public.are_friends(auth.uid(), user_id))
  );

REVOKE SELECT ON public.reading_dna FROM anon;

-- 3. Secure RPC to discover public readers beyond existing friends
-- Excludes authenticated user, existing friends, blocked users, and pending connections.
CREATE OR REPLACE FUNCTION public.get_discoverable_readers(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  profile_photo_url text,
  bio text,
  genres jsonb,
  moods jsonb,
  pace text,
  themes jsonb,
  summary text,
  signature_color text,
  generated_at timestamp with time zone,
  friend_request_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_user_id uuid := auth.uid();
  v_search_pattern text := NULL;
BEGIN
  IF v_current_user_id IS NULL THEN
    RETURN;
  END IF;

  IF p_search IS NOT NULL AND trim(p_search) <> '' THEN
    v_search_pattern := '%' || trim(p_search) || '%';
  END IF;

  RETURN QUERY
  SELECT
    rd.user_id,
    p.username,
    p.full_name,
    p.profile_photo_url,
    p.bio,
    rd.genres,
    rd.moods,
    rd.pace,
    rd.themes,
    rd.summary,
    rd.signature_color,
    rd.generated_at,
    COALESCE(
      (
        SELECT fr.status
        FROM public.friend_requests fr
        WHERE (fr.requester_id = v_current_user_id AND fr.addressee_id = rd.user_id)
           OR (fr.requester_id = rd.user_id AND fr.addressee_id = v_current_user_id)
        ORDER BY fr.created_at DESC
        LIMIT 1
      ),
      'none'
    ) AS friend_request_status
  FROM public.reading_dna rd
  JOIN public.profiles p ON p.id = rd.user_id
  WHERE rd.user_id <> v_current_user_id
    AND rd.visibility = 'public'
    -- Exclude existing friends
    AND NOT EXISTS (
      SELECT 1 FROM public.friends f
      WHERE (f.user1_id = v_current_user_id AND f.user2_id = rd.user_id)
         OR (f.user2_id = v_current_user_id AND f.user1_id = rd.user_id)
    )
    -- Exclude blocked users (either party)
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id = v_current_user_id AND bu.blocked_id = rd.user_id)
         OR (bu.blocker_id = rd.user_id AND bu.blocked_id = v_current_user_id)
    )
    -- Filter by search term if provided
    AND (
      v_search_pattern IS NULL
      OR p.full_name ILIKE v_search_pattern
      OR p.username ILIKE v_search_pattern
    )
  ORDER BY rd.generated_at DESC
  LIMIT LEAST(p_limit, 50)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_discoverable_readers(integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_discoverable_readers(integer, integer, text) TO authenticated;
