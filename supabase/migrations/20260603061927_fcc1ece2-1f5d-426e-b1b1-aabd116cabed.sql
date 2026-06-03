UPDATE public.books_library
SET title = 'Robert Louis Stevenson',
    author = 'Lettice Ulpha Cooper'
WHERE id = 'a6539dc3-cc6c-4991-908c-c5b4d214bcbd'
  AND title = 'Robert Louis Stevenson'
  AND author = 'Lettice Ulpha Cooper';

-- Actual swap: title should be the author name reversed
UPDATE public.books_library
SET title = 'Lettice Ulpha Cooper',
    author = 'Robert Louis Stevenson'
WHERE id = 'a6539dc3-cc6c-4991-908c-c5b4d214bcbd';