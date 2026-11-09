-- Migration: Refine Book Categories and Reclassify Sacred Scriptures
-- Corrects books like Shri Durga Saptashati erroneously marked as 'Fiction' by upstream Google Books providers.
-- Normalizes raw/verbose categories into standard Sahadhyayi genre taxonomy.

-- 1. Reclassify Shri Durga Saptashati and sacred texts mistagged as Fiction
UPDATE public.books_library
SET genre = 'Spiritual'
WHERE title ILIKE '%Durga Saptashati%'
   OR title ILIKE '%Sri Sri Chandi%'
   OR title ILIKE '%Shree Durga Saptashati%'
   OR title ILIKE '%Shri Durga Saptashati%';

-- 2. Reclassify Bhagavad Gita, Ramayana, and Vedic scriptures to Spiritual
UPDATE public.books_library
SET genre = 'Spiritual'
WHERE title ILIKE '%Bhagavad%Gita%'
   OR title ILIKE '%Bhagwat%Geeta%'
   OR title ILIKE '%Bhagavadgita%'
   OR title ILIKE '%Ramayana%'
   OR title ILIKE '%Ramcharitmanas%'
   OR title ILIKE '%Ashtavakra%Geeta%'
   OR title ILIKE '%Upanishad%'
   OR title ILIKE '%Shiv Sutra%'
   OR title ILIKE '%Shiv Puran%'
   OR title ILIKE '%Gayatri Mantra%'
   OR title ILIKE '%Gayathri Mantra%'
   OR title ILIKE '%Hanuman Chalisa%'
   OR genre IN (
     'Religion',
     'Hinduism',
     'Vedas',
     'Bhagavadgītā',
     'Sandhyā (Hindu rite)',
     'Vaishnavism',
     'Gāyatrī (Hindu deity)',
     'Gaṇeśa (Hindu deity)',
     'Om',
     'Hinduism; Religion and spirituality; Indian philosophy'
   );

-- 3. Normalize verbose/raw academic and library tags into canonical genres
UPDATE public.books_library
SET genre = 'Classics'
WHERE genre = 'Classic Literature';

UPDATE public.books_library
SET genre = 'Biography'
WHERE genre = 'Biography & Autobiography'
   OR genre ILIKE 'Biography /%';

UPDATE public.books_library
SET genre = 'Science'
WHERE genre ILIKE '%Chemistry;%'
   OR genre ILIKE '%Physics;%'
   OR genre ILIKE '%Biology;%'
   OR genre IN ('Physics', 'Astrophysics', 'Scientific monograph');

UPDATE public.books_library
SET genre = 'Technology'
WHERE genre ILIKE 'Artificial intelligence%';

UPDATE public.books_library
SET genre = 'Philosophy'
WHERE genre = 'Hindu philosophy';

UPDATE public.books_library
SET genre = 'Reference'
WHERE genre ILIKE 'Subject headings%';
