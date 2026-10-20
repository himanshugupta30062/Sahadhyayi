
-- Enforce case-insensitive username uniqueness so profile updates and concurrent
-- signups cannot create usernames that differ only by capitalization.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique_idx
ON public.profiles (lower(username))
WHERE username IS NOT NULL AND btrim(username) <> '';
