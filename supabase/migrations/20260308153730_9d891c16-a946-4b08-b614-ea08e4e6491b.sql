-- Mark additional non-authentic entries that slipped through
UPDATE public.authors SET is_authentic = false
WHERE name IN (
  'GBP Editorial',
  'Sapiens Editorial',
  'IGOR. EVGENYEVICH IRODOV',
  'I.E. IRODOV',
  'POOJYA ACHARYASHRI CHARANTIRTHA MAHARAJ (PURVASHRAM: RAJVAIDYA JIVRAM KALIDAS SHASTRI)'
);

-- Also mark any author whose name contains "Editorial" 
UPDATE public.authors SET is_authentic = false
WHERE name ~* 'editorial' AND is_authentic = true;
