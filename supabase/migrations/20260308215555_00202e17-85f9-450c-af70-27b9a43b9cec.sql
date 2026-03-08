-- Mark organizational entities as non-authentic
UPDATE public.authors SET is_authentic = false WHERE id IN (
  'bd2cd206-c444-4aa4-baeb-a848cb4d0f3b', -- Lok Sabha Secretariat
  '4f782581-49cb-4b41-ae4e-92b83c9e59e9'  -- Rajya Sabha Secretariat
);

-- Update Stephen Hawking's books_count to match actual books
UPDATE public.authors SET books_count = 5 WHERE id = 'fdbd63a1-795b-4184-8c5a-952c1e087de3';