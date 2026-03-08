

# User Book Publishing Feature

## Overview
Allow authenticated users to publish their own books to the library. Users can upload a PDF, cover image, and fill in book metadata. Published books go through an approval workflow — they're visible to the author immediately but only appear in the public library after admin approval.

## Database Changes

**New table: `user_published_books`**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, NOT NULL)
- `title` (text, NOT NULL)
- `author_name` (text, NOT NULL) — defaults to user's profile name
- `description` (text)
- `genre` (text)
- `language` (text, default 'English')
- `pages` (integer)
- `isbn` (text)
- `cover_image_url` (text)
- `pdf_url` (text)
- `status` (text: 'draft', 'pending_review', 'approved', 'rejected', default 'draft')
- `rejection_reason` (text)
- `created_at`, `updated_at` (timestamptz)

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own rows
- Admins can SELECT and UPDATE all rows (for approval workflow)
- Public can SELECT where `status = 'approved'`

**Storage:** Use existing `books` bucket for PDF and cover uploads, with a `user-uploads/` prefix path.

## Frontend Changes

1. **New page: `/publish`** — Multi-step form for publishing a book:
   - Step 1: Title, author name, description, genre, language, pages
   - Step 2: Upload cover image and PDF file
   - Step 3: Preview and submit
   - Protected route (auth required)

2. **New page: `/my-publications`** — Dashboard showing user's published books with status badges (draft/pending/approved/rejected), edit and delete actions.

3. **"Publish Your Book" button** on the library page and navigation for discoverability.

4. **Approved books integration** — Approved books automatically appear in the main library via a database view or query that unions `books_library` with approved `user_published_books`.

## Architecture

```text
User → /publish (form + file upload)
  ↓
user_published_books (status: 'pending_review')
  ↓
Admin reviews via existing admin tools
  ↓
status → 'approved' → appears in library
```

## Key Files to Create/Modify
- **Create:** `src/pages/PublishBook.tsx` — publish form
- **Create:** `src/pages/MyPublications.tsx` — user's books dashboard
- **Create:** `src/hooks/usePublishBook.ts` — CRUD hooks
- **Modify:** `src/App.tsx` — add routes
- **Modify:** `src/pages/library.tsx` — add "Publish" CTA
- **Migration:** Create `user_published_books` table + RLS policies

