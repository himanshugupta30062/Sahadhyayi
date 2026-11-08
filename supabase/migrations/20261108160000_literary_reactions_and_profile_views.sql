-- =============================================================================
-- Migration: 20261108160000_literary_reactions_and_profile_views.sql
-- Description: Adds Misskey-style literary reactions (loved, insightful, devastating,
--              cozy, unputdownable, thought_provoking) and aggregated counting RPCs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.social_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('loved', 'insightful', 'devastating', 'cozy', 'unputdownable', 'thought_provoking')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_social_post_reactions_user_post UNIQUE (post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.social_post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view post reactions" ON public.social_post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reactions" ON public.social_post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.social_post_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.social_post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_social_post_reactions_post_id ON public.social_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_reactions_user_id ON public.social_post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_reactions_type ON public.social_post_reactions(post_id, reaction_type);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_post_reactions TO authenticated;
GRANT SELECT ON public.social_post_reactions TO anon;

-- RPC: Toggle a literary reaction for the authenticated caller
CREATE OR REPLACE FUNCTION public.toggle_social_post_reaction(
  p_post_id UUID,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_current_reaction TEXT;
  v_new_reaction TEXT := NULL;
  v_counts JSONB;
  v_total INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to react to posts';
  END IF;

  IF p_reaction_type NOT IN ('loved', 'insightful', 'devastating', 'cozy', 'unputdownable', 'thought_provoking') THEN
    RAISE EXCEPTION 'Invalid literary reaction type: %', p_reaction_type;
  END IF;

  SELECT reaction_type INTO v_current_reaction
  FROM public.social_post_reactions
  WHERE post_id = p_post_id AND user_id = v_uid;

  IF v_current_reaction IS NULL THEN
    INSERT INTO public.social_post_reactions (post_id, user_id, reaction_type)
    VALUES (p_post_id, v_uid, p_reaction_type);
    v_new_reaction := p_reaction_type;
  ELSIF v_current_reaction = p_reaction_type THEN
    DELETE FROM public.social_post_reactions
    WHERE post_id = p_post_id AND user_id = v_uid;
    v_new_reaction := NULL;
  ELSE
    UPDATE public.social_post_reactions
    SET reaction_type = p_reaction_type, created_at = now()
    WHERE post_id = p_post_id AND user_id = v_uid;
    v_new_reaction := p_reaction_type;
  END IF;

  SELECT coalesce(jsonb_object_agg(reaction_type, cnt), '{}'::jsonb), sum(cnt)::int INTO v_counts, v_total
  FROM (
    SELECT reaction_type, count(*)::int AS cnt
    FROM public.social_post_reactions
    WHERE post_id = p_post_id
    GROUP BY reaction_type
  ) sub;

  RETURN jsonb_build_object(
    'user_reaction', v_new_reaction,
    'counts', coalesce(v_counts, '{}'::jsonb),
    'total', coalesce(v_total, 0)
  );
END;
$$;

-- RPC: Batch fetch reactions for feed cards to eliminate N+1 queries
CREATE OR REPLACE FUNCTION public.get_batch_post_reactions(p_post_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_result JSONB;
BEGIN
  SELECT coalesce(
    jsonb_object_agg(
      post_id::text,
      jsonb_build_object(
        'user_reaction', user_reaction,
        'counts', counts,
        'total', total
      )
    ),
    '{}'::jsonb
  ) INTO v_result
  FROM (
    SELECT 
      p.id AS post_id,
      (
        SELECT reaction_type 
        FROM public.social_post_reactions r 
        WHERE r.post_id = p.id AND r.user_id = v_uid
      ) AS user_reaction,
      coalesce(
        (
          SELECT jsonb_object_agg(r.reaction_type, r.cnt)
          FROM (
            SELECT reaction_type, count(*)::int AS cnt
            FROM public.social_post_reactions
            WHERE post_id = p.id
            GROUP BY reaction_type
          ) r
        ),
        '{}'::jsonb
      ) AS counts,
      (
        SELECT count(*)::int
        FROM public.social_post_reactions
        WHERE post_id = p.id
      ) AS total
    FROM unnest(p_post_ids) AS p(id)
  ) summary;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_social_post_reaction(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_batch_post_reactions(UUID[]) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

