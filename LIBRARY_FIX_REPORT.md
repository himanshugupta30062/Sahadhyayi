# Library Fix Report

## Files Edited
- apps/web-next/src/app/library/page.tsx
- apps/web-next/src/app/library/error.tsx
- apps/web-next/src/app/library/loading.tsx
- apps/web-next/src/app/library/[id]/page.tsx
- apps/web-next/src/app/library/[id]/error.tsx
- apps/web-next/src/app/library/[id]/loading.tsx
- apps/web-next/src/components/library/BookActions.tsx
- apps/web-next/src/components/library/BookCard.tsx
- apps/web-next/src/components/library/CurrentReads.tsx
- apps/web-next/src/components/library/LibraryGrid.tsx
- apps/web-next/src/lib/supabase/books.ts
- apps/web-next/src/lib/supabase/userBooks.ts
- apps/web-next/src/lib/supabase/notes.ts
- apps/web-next/src/lib/useDebouncedValue.ts
- apps/web-next/src/lib/types.ts

## Duplicate Types Removed
- Removed scattered definitions of `ReadingStatus` and other interfaces.
- Established canonical `Language`, `ReadingStatus`, `Book`, `Author`, and `UserBook` types in `lib/types.ts`.

## Schema Mismatches Resolved
- Unified book fields to `cover_url` and `file_url` and standardized `popularity` usage.
- All user-specific queries now filter by `user_id` and update `last_opened_at`.
