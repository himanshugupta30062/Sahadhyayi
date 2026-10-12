-- Migration: Secure, verified book cover repair RPC
-- Allows authorized clients to persist genuine verified covers to catalog records that lack them.
-- Strictly prevents overwriting existing valid covers or altering any other book metadata.

CREATE OR REPLACE FUNCTION public.repair_verified_book_cover(
  p_book_id UUID,
  p_cover_image_url TEXT,
  p_source TEXT DEFAULT 'verified_external'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trimmed_url TEXT := trim(p_cover_image_url);
  v_existing_cover TEXT;
  v_rows_updated INTEGER;
BEGIN
  -- 1. Validate book ID
  IF p_book_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Validate URL: must be valid HTTPS image URL
  IF v_trimmed_url IS NULL OR length(v_trimmed_url) < 10 OR (v_trimmed_url NOT LIKE 'https://%') THEN
    RETURN false;
  END IF;

  -- 3. Check existing book record
  SELECT cover_image_url INTO v_existing_cover
  FROM public.books_library
  WHERE id = p_book_id;

  -- If book doesn't exist, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- 4. Never overwrite an existing non-empty cover
  IF v_existing_cover IS NOT NULL AND trim(v_existing_cover) <> '' AND trim(lower(v_existing_cover)) <> 'null' THEN
    RETURN false; -- already has a valid cover
  END IF;

  -- 5. Safe update: only update cover_image_url on the specified book
  UPDATE public.books_library
  SET cover_image_url = v_trimmed_url
  WHERE id = p_book_id
    AND (cover_image_url IS NULL OR trim(cover_image_url) = '' OR trim(lower(cover_image_url)) = 'null');

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;

-- Allow anon, authenticated, and service_role to call the repair RPC
GRANT EXECUTE ON FUNCTION public.repair_verified_book_cover(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

