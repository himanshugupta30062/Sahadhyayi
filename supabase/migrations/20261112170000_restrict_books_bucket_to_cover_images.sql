-- Limit user-uploaded article covers to common image formats and 5 MiB.
-- Existing article cover objects are retained; this affects new uploads only.
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'books';
