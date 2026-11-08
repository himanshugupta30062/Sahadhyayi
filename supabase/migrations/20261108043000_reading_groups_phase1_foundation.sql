-- Reading Groups Phase 1: additive privacy and membership foundation.
-- This migration intentionally does not change existing RLS policies or frontend behavior.
-- Policies/RPCs are hardened in a follow-up migration after staging policy inventory.

ALTER TABLE public.group_chats
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS join_policy text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS language_code text,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.group_chats
  DROP CONSTRAINT IF EXISTS group_chats_visibility_check,
  ADD CONSTRAINT group_chats_visibility_check
    CHECK (visibility IN ('public', 'private', 'unlisted')),
  DROP CONSTRAINT IF EXISTS group_chats_join_policy_check,
  ADD CONSTRAINT group_chats_join_policy_check
    CHECK (join_policy IN ('open', 'approval', 'invite_only')),
  DROP CONSTRAINT IF EXISTS group_chats_private_join_policy_check,
  ADD CONSTRAINT group_chats_private_join_policy_check
    CHECK (visibility <> 'private' OR join_policy <> 'open');

-- Slugs are optional, normalized by the application, and never act as credentials.
CREATE UNIQUE INDEX IF NOT EXISTS group_chats_slug_unique
  ON public.group_chats (lower(slug))
  WHERE slug IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS group_chats_visibility_created_at_idx
  ON public.group_chats (visibility, created_at DESC)
  WHERE archived_at IS NULL;

ALTER TABLE public.group_chat_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.group_chat_members
  DROP CONSTRAINT IF EXISTS group_chat_members_status_check,
  ADD CONSTRAINT group_chat_members_status_check
    CHECK (status IN ('pending', 'active', 'banned'));

-- Preserve legacy admin/member rows; allow owner as a distinct role for new lifecycle controls.
ALTER TABLE public.group_chat_members
  DROP CONSTRAINT IF EXISTS group_chat_members_role_check,
  ADD CONSTRAINT group_chat_members_role_check
    CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- The canonical schema already enforces UNIQUE(group_id, user_id); do not add a duplicate index.

CREATE INDEX IF NOT EXISTS group_chat_members_user_status_idx
  ON public.group_chat_members (user_id, status);

CREATE INDEX IF NOT EXISTS group_chat_members_group_status_role_idx
  ON public.group_chat_members (group_id, status, role);

-- Invitations store only a digest of the high-entropy bearer token.
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_invitations_max_uses_check
    CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT group_invitations_uses_count_check
    CHECK (uses_count >= 0 AND (max_uses IS NULL OR uses_count <= max_uses))
);

CREATE INDEX IF NOT EXISTS group_invitations_group_created_idx
  ON public.group_invitations (group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS group_invitations_expiry_idx
  ON public.group_invitations (expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- No direct table reads/writes from anon or authenticated clients.
-- All invitation operations are routed through narrowly scoped RPCs in the next PR.
REVOKE ALL ON TABLE public.group_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_invitations TO service_role;

COMMENT ON COLUMN public.group_chats.visibility IS
  'Discovery/metadata visibility: public, private, or unlisted. Does not grant message access.';
COMMENT ON COLUMN public.group_chats.join_policy IS
  'Membership admission policy: open, approval, or invite_only; enforced by server-side RPC/RLS.';
COMMENT ON COLUMN public.group_chats.is_encrypted IS
  'Encryption state/capability only; must not be used as a group privacy or join-policy flag.';
COMMENT ON COLUMN public.group_chat_members.status IS
  'Membership lifecycle: pending, active, or banned. Only active members may access group content.';
COMMENT ON TABLE public.group_invitations IS
  'Private invitation credentials; token_hash contains a digest, never the raw invitation token.';
