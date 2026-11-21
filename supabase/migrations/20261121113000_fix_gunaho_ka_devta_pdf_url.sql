-- Fix Gunaho Ka Devta verified Supabase Storage PDF URL
-- Ensures in-page reader loads the verified high-quality asset rather than dead 404 details URLs.

UPDATE public.books_library
SET 
  pdf_url = 'https://rknxtatvlzunatpyqxro.supabase.co/storage/v1/object/public/books/Hindi%20Fiction/Gunahon%20Ka%20Devta/PDF/Gunaho_Ka_Devta.pdf',
  reader_link_status = 'verified',
  reader_link_http_status = 200,
  reader_link_content_type = 'application/pdf',
  pdf_quality_score = 100,
  asset_quality_status = 'verified'
WHERE (
  title ILIKE '%Gunaho%Ka%Devta%' OR 
  title ILIKE '%Gunahon%Ka%Devta%'
)
AND (
  pdf_url IS NULL OR 
  pdf_url = '' OR 
  pdf_url ILIKE '%archive.org/details%' OR
  pdf_url ILIKE '%archive.org%'
);
