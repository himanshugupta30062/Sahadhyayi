# Adding Books to the Library

This project stores library books in a Supabase table named `books_library`. Each entry contains metadata about a book along with optional links to the cover image and a digital copy of the book. The hooks under `src/hooks/useLibraryBooks.ts` rely on this table.

## Create the `books_library` Table

1. Open your [Supabase](https://supabase.com/) project dashboard.
2. Navigate to **Table Editor** and create a new table called **`books_library`**.
3. Add the following columns (all text unless noted otherwise):
   - `title` – the book title (required)
   - `author` – author name
   - `genre` – category or genre
   - `description` – short description
   - `author_bio` – information about the author
   - `cover_image_url` – URL to an uploaded cover image
   - `pdf_url` – URL to the e‑book file (PDF)
   - `amazon_url` – optional store link
   - `google_books_url` – optional Google Books link
   - `internet_archive_url` – optional Internet Archive link
   - `isbn` – ISBN number
   - `publication_year` – integer
   - `pages` – integer
   - `language` – language of the book
   - `price` – numeric price
   - `created_at` – timestamp with default value `now()`

4. Save the table. You can manually insert rows using the Supabase table editor UI.
5. Upload cover images or PDFs to Supabase Storage and paste their public URLs into `cover_image_url` and `pdf_url`.

## Viewing Books in the App

The `BookLibrary` page fetches records from `books_library` via the `useLibraryBooks` hook. Any books you add to the table become visible in the Library section automatically once the app reloads.

For uploading cover images programmatically, see `src/hooks/useBookCoverUpload.ts` which stores files in the `book-covers` storage bucket.
