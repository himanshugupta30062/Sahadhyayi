---
name: Social book-native features
description: Margin Notes, Reading Rooms (Presence/Broadcast), Spoiler-Safe Threads (chapter-gated view), Reading DNA (Gemini-generated taste fingerprint) — all live in /social.
type: feature
---
Tables: margin_notes (+ replies, reactions), reading_rooms (+ messages, events; realtime publication), spoiler_threads (+ comments; `user_chapter_progress()` security-definer fn; `spoiler_threads_safe` view with security_invoker), reading_dna.

UI lives under src/components/social/{margins,rooms,threads,dna}/. Hooks: useMarginNotes, useSpoilerThreads, useReadingRoom (Presence + Broadcast), useReadingDna.

Edge function `generate-reading-dna` (verify_jwt = true): JWT-validated via getUser, rate-limited 1/5 min via check_rate_limit, calls Gemini 2.0 Flash JSON mode with shelf snapshot, falls back to a heuristic when AI is unavailable. Match % is pure logic in src/lib/readingDna.ts (weighted Jaccard genres + set-overlap moods/themes + pace alignment).

Realtime channels are inside useEffect with supabase.removeChannel cleanup.
