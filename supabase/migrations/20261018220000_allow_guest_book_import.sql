-- Migration: 20261018220000_allow_guest_book_import.sql
-- Description: Enable guest readers and unauthenticated visitors to save books from Ultimate Book Finder to the catalog
-- Authoritative, secure RPC for saving and enriching books in books_library with duplicate protection and enrichment.

CREATE OR REPLACE FUNCTION public.save_selected_books(p_books jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_book jsonb;
  v_title text;
  v_author text;
  v_genre text;
  v_cover_image_url text;
  v_description text;
  v_author_bio text;
  v_isbn text;
  v_publication_year int;
  v_pages int;
  v_language text;
  v_pdf_url text;
  
  v_existing_id uuid;
  v_existing_cover text;
  v_existing_desc text;
  v_existing_pdf text;
  v_existing_author_bio text;
  v_existing_genre text;
  v_existing_year int;
  v_existing_pages int;
  
  v_inserted_count int := 0;
  v_enriched_count int := 0;
  v_duplicate_count int := 0;
  v_failed_count int := 0;
  
  v_results jsonb := '[]'::jsonb;
  v_saved_books jsonb := '[]'::jsonb;
  v_duplicate_books jsonb := '[]'::jsonb;
  v_new_id uuid;
  v_enriched_fields text[];
BEGIN
  -- 1. Optional user identification: guests and authenticated readers can both save books
  v_user_id := auth.uid();

  -- 2. Validate input is JSON array
  IF p_books IS NULL OR jsonb_typeof(p_books) <> 'array' OR jsonb_array_length(p_books) = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'booksSaved', 0,
      'newlyInserted', 0,
      'enrichedCount', 0,
      'duplicatesFound', 0,
      'failedCount', 0,
      'books', '[]'::jsonb,
      'duplicates', '[]'::jsonb,
      'results', '[]'::jsonb
    );
  END IF;

  -- 3. Iterate over each book in payload
  FOR v_book IN SELECT * FROM jsonb_array_elements(p_books)
  LOOP
    BEGIN
      v_title := nullif(trim(v_book->>'title'), '');
      IF v_title IS NULL THEN
        v_failed_count := v_failed_count + 1;
        v_results := v_results || jsonb_build_object(
          'title', COALESCE(v_book->>'title', 'Untitled'),
          'status', 'failed',
          'error', 'Missing book title'
        );
        CONTINUE;
      END IF;

      -- Truncate and sanitize inputs safely
      v_title := substring(v_title from 1 for 300);
      v_author := nullif(trim(v_book->>'author'), '');
      IF v_author IS NOT NULL THEN
        v_author := substring(v_author from 1 for 200);
      END IF;

      v_genre := nullif(trim(v_book->>'genre'), '');
      IF v_genre IS NOT NULL THEN
        v_genre := substring(v_genre from 1 for 100);
      END IF;

      v_cover_image_url := nullif(trim(v_book->>'cover_image_url'), '');
      IF v_cover_image_url IS NOT NULL AND NOT (v_cover_image_url LIKE 'http://%' OR v_cover_image_url LIKE 'https://%') THEN
        v_cover_image_url := NULL;
      ELSIF v_cover_image_url IS NOT NULL THEN
        v_cover_image_url := substring(v_cover_image_url from 1 for 1000);
      END IF;

      v_description := nullif(trim(v_book->>'description'), '');
      IF v_description IS NOT NULL THEN
        v_description := substring(v_description from 1 for 10000);
      END IF;

      v_author_bio := nullif(trim(v_book->>'author_bio'), '');
      IF v_author_bio IS NOT NULL THEN
        v_author_bio := substring(v_author_bio from 1 for 2000);
      END IF;

      v_isbn := nullif(trim(v_book->>'isbn'), '');
      IF v_isbn IS NOT NULL THEN
        v_isbn := regexp_replace(v_isbn, '[^0-9X-]', '', 'gi');
        IF length(v_isbn) > 20 THEN
          v_isbn := substring(v_isbn from 1 for 20);
        END IF;
      END IF;

      v_publication_year := NULL;
      IF v_book->>'publication_year' IS NOT NULL AND (v_book->>'publication_year') ~ '^-?[0-9]+$' THEN
        v_publication_year := (v_book->>'publication_year')::int;
        IF v_publication_year < -3000 OR v_publication_year > 2100 THEN
          v_publication_year := NULL;
        END IF;
      END IF;

      v_pages := NULL;
      IF v_book->>'pages' IS NOT NULL AND (v_book->>'pages') ~ '^[0-9]+$' THEN
        v_pages := (v_book->>'pages')::int;
        IF v_pages < 1 OR v_pages > 50000 THEN
          v_pages := NULL;
        END IF;
      END IF;

      v_language := COALESCE(nullif(trim(v_book->>'language'), ''), 'English');
      v_language := substring(v_language from 1 for 50);

      v_pdf_url := nullif(trim(v_book->>'pdf_url'), '');
      IF v_pdf_url IS NOT NULL AND NOT (v_pdf_url LIKE 'http://%' OR v_pdf_url LIKE 'https://%') THEN
        v_pdf_url := NULL;
      ELSIF v_pdf_url IS NOT NULL THEN
        v_pdf_url := substring(v_pdf_url from 1 for 1000);
      END IF;

      -- 4. Duplicate Check
      -- Priority A: ISBN lookup if available
      v_existing_id := NULL;
      IF v_isbn IS NOT NULL THEN
        SELECT id, cover_image_url, description, pdf_url, author_bio, genre, publication_year, pages
        INTO v_existing_id, v_existing_cover, v_existing_desc, v_existing_pdf, v_existing_author_bio, v_existing_genre, v_existing_year, v_existing_pages
        FROM public.books_library
        WHERE isbn = v_isbn
        LIMIT 1;
      END IF;

      -- Priority B: exact normalized Title + Author
      IF v_existing_id IS NULL AND v_author IS NOT NULL THEN
        SELECT id, cover_image_url, description, pdf_url, author_bio, genre, publication_year, pages
        INTO v_existing_id, v_existing_cover, v_existing_desc, v_existing_pdf, v_existing_author_bio, v_existing_genre, v_existing_year, v_existing_pages
        FROM public.books_library
        WHERE lower(trim(title)) = lower(v_title)
          AND lower(trim(COALESCE(author, ''))) = lower(v_author)
        LIMIT 1;
      ELSIF v_existing_id IS NULL THEN
        SELECT id, cover_image_url, description, pdf_url, author_bio, genre, publication_year, pages
        INTO v_existing_id, v_existing_cover, v_existing_desc, v_existing_pdf, v_existing_author_bio, v_existing_genre, v_existing_year, v_existing_pages
        FROM public.books_library
        WHERE lower(trim(title)) = lower(v_title)
        LIMIT 1;
      END IF;

      -- 5. If duplicate found: enrich missing fields
      IF v_existing_id IS NOT NULL THEN
        v_enriched_fields := ARRAY[]::text[];
        
        IF (v_existing_cover IS NULL OR v_existing_cover = '') AND v_cover_image_url IS NOT NULL THEN
          UPDATE public.books_library SET cover_image_url = v_cover_image_url WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'cover_image_url');
        END IF;

        IF (v_existing_desc IS NULL OR v_existing_desc = '') AND v_description IS NOT NULL THEN
          UPDATE public.books_library SET description = v_description WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'description');
        END IF;

        IF (v_existing_pdf IS NULL OR v_existing_pdf = '') AND v_pdf_url IS NOT NULL THEN
          UPDATE public.books_library SET pdf_url = v_pdf_url WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'pdf_url');
        END IF;

        IF (v_existing_author_bio IS NULL OR v_existing_author_bio = '') AND v_author_bio IS NOT NULL THEN
          UPDATE public.books_library SET author_bio = v_author_bio WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'author_bio');
        END IF;

        IF (v_existing_genre IS NULL OR v_existing_genre = '') AND v_genre IS NOT NULL THEN
          UPDATE public.books_library SET genre = v_genre WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'genre');
        END IF;

        IF v_existing_year IS NULL AND v_publication_year IS NOT NULL THEN
          UPDATE public.books_library SET publication_year = v_publication_year WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'publication_year');
        END IF;

        IF v_existing_pages IS NULL AND v_pages IS NOT NULL THEN
          UPDATE public.books_library SET pages = v_pages WHERE id = v_existing_id;
          v_enriched_fields := array_append(v_enriched_fields, 'pages');
        END IF;

        IF array_length(v_enriched_fields, 1) > 0 THEN
          v_enriched_count := v_enriched_count + 1;
          v_results := v_results || jsonb_build_object(
            'id', v_existing_id,
            'title', v_title,
            'status', 'enriched',
            'enrichedFields', to_jsonb(v_enriched_fields)
          );
          v_duplicate_books := v_duplicate_books || jsonb_build_object(
            'id', v_existing_id,
            'title', v_title,
            'author', v_author,
            'enriched', true
          );
        ELSE
          v_duplicate_count := v_duplicate_count + 1;
          v_results := v_results || jsonb_build_object(
            'id', v_existing_id,
            'title', v_title,
            'status', 'already_exists'
          );
          v_duplicate_books := v_duplicate_books || jsonb_build_object(
            'id', v_existing_id,
            'title', v_title,
            'author', v_author,
            'enriched', false
          );
        END IF;

      ELSE
        -- 6. Insert new book into books_library
        INSERT INTO public.books_library (
          title,
          author,
          genre,
          cover_image_url,
          description,
          author_bio,
          isbn,
          publication_year,
          pages,
          language,
          pdf_url
        ) VALUES (
          v_title,
          v_author,
          v_genre,
          v_cover_image_url,
          v_description,
          v_author_bio,
          v_isbn,
          v_publication_year,
          v_pages,
          v_language,
          v_pdf_url
        )
        RETURNING id INTO v_new_id;

        v_inserted_count := v_inserted_count + 1;
        v_results := v_results || jsonb_build_object(
          'id', v_new_id,
          'title', v_title,
          'status', 'inserted'
        );
        v_saved_books := v_saved_books || jsonb_build_object(
          'id', v_new_id,
          'title', v_title,
          'author', v_author
        );
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
      v_results := v_results || jsonb_build_object(
        'title', COALESCE(v_title, 'Unknown'),
        'status', 'failed',
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- 7. Return detailed response matching frontend SaveBooksResponse
  RETURN jsonb_build_object(
    'success', true,
    'booksSaved', v_inserted_count + v_enriched_count,
    'newlyInserted', v_inserted_count,
    'enrichedCount', v_enriched_count,
    'duplicatesFound', v_duplicate_count + v_enriched_count,
    'failedCount', v_failed_count,
    'books', v_saved_books,
    'duplicates', v_duplicate_books,
    'results', v_results
  );
END;
$$;

-- Grant permissions for guests (anon), authenticated readers and service role
GRANT EXECUTE ON FUNCTION public.save_selected_books(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.save_selected_books(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_selected_books(jsonb) TO service_role;

