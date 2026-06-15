
# Social Media — Book-Native Features (MVP sprint)

Ship four firsts-of-their-kind features into `/social`, all wired to real data via Supabase. Each lands as a working MVP — schema + RLS + UI + minimal polish — not a mock.

## New tabs on `/social`

```text
[ Feed ] [ Rooms ] [ Threads ] [ Margins ] [ DNA ] [ Friends ] [ Map ] [ Groups ]
```

The 4 new tabs:

1. **Rooms** — Reading Rooms (live co-read)
2. **Threads** — Chapter Spoiler-Safe Threads
3. **Margins** — Margin Notes feed
4. **DNA** — Reading DNA + Match %

---

## 1. Margin Notes feed

What it is: readers highlight a passage in a book, write a thought, and post it as a "margin note". Friends can react, reply, and add their own note anchored to the same page — building a living margin around each book.

UX
- From `BookReader` and `BookDetails`: "Add margin note" → modal with quote text + page + thought.
- `/social` → **Margins** tab: feed of recent margin notes (friends + global toggle), each card shows book cover, quoted passage in a pull-quote style, the note, reactions, and inline replies.
- Click a card → opens the book at that page with the note pinned.

Data
- New table `margin_notes(book_id, user_id, page, quote, note, visibility[public|friends], reactions_count, replies_count)`.
- New table `margin_note_replies(margin_note_id, user_id, body)`.
- New table `margin_note_reactions(margin_note_id, user_id, emoji)` — unique on (note, user, emoji).
- RLS: public notes readable by all; friends-only readable when `are_friends(auth.uid(), user_id)` or self; owner can edit/delete; replies/reactions readable when parent is readable.

## 2. Reading Rooms (live co-read)

What it is: a lightweight realtime room scoped to one book. Shows who is currently reading, their current page (opted-in), a live chat, and a soft "pulse" event whenever someone finishes a chapter.

UX
- **Rooms** tab lists active rooms (book cover, name, live reader count, your friends inside).
- Open a room → split layout: left = live participant list with current page + last chapter pulse; right = chat. "Join room" sets presence; "Leave" clears it.
- Optional "Share my page" toggle (off by default).

Data + realtime
- New table `reading_rooms(book_id unique, name, created_by)`.
- Supabase Realtime **Presence** channel per room: `room:<book_id>` carries `{user_id, page, share_page, joined_at}`.
- Supabase Realtime **Broadcast** for chat (`room_chat`) and chapter pulses (`chapter_complete`), persisted to:
  - `reading_room_messages(room_id, user_id, body)`
  - `reading_room_events(room_id, user_id, kind[chapter_complete|joined|left], chapter)`
- Chapter pulses are emitted client-side from existing `detailed_reading_progress` updates.
- RLS: anyone signed in can read rooms + messages + events; insert restricted to `auth.uid() = user_id`.

## 3. Chapter Spoiler-Safe Threads

What it is: discussion threads tagged with a `min_chapter`. The server hides the body until the viewer's recorded progress reaches that chapter, so spoilers are impossible by construction.

UX
- **Threads** tab → list of threads grouped by book. Each thread shows title + "Unlocks at Ch. N" badge.
- If locked: card is blurred with a lock icon and "Read up to chapter N to unlock". A "Mark Ch. N complete" shortcut links to the reader.
- If unlocked: full thread + comments, with author/avatar.

Data
- New table `spoiler_threads(book_id, user_id, title, body, min_chapter)`.
- New table `spoiler_thread_comments(thread_id, user_id, body, min_chapter)` — comments can be deeper-locked.
- Security-definer function `public.user_chapter_progress(_user uuid, _book uuid) returns int` returning the max `chapter_number` from `detailed_reading_progress` with `completion_percentage >= 100`.
- View `spoiler_threads_safe`: returns thread metadata always, but masks `body`/`comments` when `user_chapter_progress(auth.uid(), book_id) < min_chapter`. UI calls the view; raw tables stay RLS-locked to owners.

## 4. Reading DNA + Match %

What it is: a generated "taste fingerprint" per reader (top genres, dominant moods, pace, themes). Profiles show a colorful DNA strip; visiting another user shows a **Match %** plus "books only one of you has read" recommendations.

UX
- **DNA** tab: your DNA card (genres pie, mood tags, pace, "shelf shape"), a "Refresh DNA" button (rate-limited).
- Friend cards across the app gain a Match % chip (e.g. "78% match").
- Opening a friend's DNA → side-by-side comparison + 5 cross-recommendations.

Data + AI
- New table `reading_dna(user_id pk, genres jsonb, moods jsonb, pace text, themes jsonb, summary text, signature_color text, generated_at)`.
- New edge function `generate-reading-dna` (verify_jwt = true): reads the caller's `user_bookshelf` + `book_ratings` + `detailed_reading_progress`, calls Lovable AI (`google/gemini-3-flash-preview`) with structured output (Zod schema), upserts the row. Rate-limited via existing `check_rate_limit`.
- Match % computed client-side from two DNA rows: weighted Jaccard over genres + cosine over mood vectors + pace alignment, normalized to 0–100. Pure function in `src/lib/readingDna.ts` so it's testable.
- Cross-recommendations: books on one shelf and not the other, filtered to top-genre overlap.

---

## Technical details

### Migrations (one per feature, in order)
1. `margin_notes`, `margin_note_replies`, `margin_note_reactions` + GRANTs + RLS using `are_friends()`.
2. `reading_rooms`, `reading_room_messages`, `reading_room_events` + GRANTs + RLS; `ALTER PUBLICATION supabase_realtime ADD TABLE …` for the two child tables.
3. `spoiler_threads`, `spoiler_thread_comments` + GRANTs + RLS; `user_chapter_progress()` security-definer fn; `spoiler_threads_safe` view (security_invoker = on) with masking expression.
4. `reading_dna` + GRANTs + RLS (owner read/write; friends can read the public-safe columns).

Every table follows the project rule: CREATE TABLE → GRANT (authenticated + service_role; anon only for fully public reads) → ENABLE RLS → POLICY.

### Frontend structure
- `src/pages/SocialMedia.tsx`: add four new tabs and lazy-load the panels.
- `src/components/social/margins/` — `MarginNotesFeed.tsx`, `MarginNoteCard.tsx`, `AddMarginNoteDialog.tsx`.
- `src/components/social/rooms/` — `ReadingRoomsList.tsx`, `ReadingRoom.tsx` (Presence + Broadcast hook), `RoomChat.tsx`.
- `src/components/social/threads/` — `SpoilerThreadList.tsx`, `SpoilerThreadCard.tsx`, `NewSpoilerThreadDialog.tsx`.
- `src/components/social/dna/` — `ReadingDnaCard.tsx`, `DnaMatchChip.tsx`, `DnaCompare.tsx`.
- Hooks: `useMarginNotes`, `useReadingRoom`, `useSpoilerThreads`, `useReadingDna`, `useDnaMatch`.
- Pure logic: `src/lib/readingDna.ts` (match score + cross-recs).

### Edge function
- `supabase/functions/generate-reading-dna/index.ts`: JWT-validated, CORS, Zod-validated input, structured-output Lovable AI call, 1 req/min per user via `check_rate_limit`.

### Realtime hygiene
- Presence + Broadcast subscriptions live inside `useEffect` with `supabase.removeChannel` cleanup — per project rule.

### Out of scope (intentional)
- Voice/audio rooms, video, payments, mod tooling beyond report buttons, push notifications.
- Polishing the legacy `EnhancedSocialFeed`, friends, map, groups tabs — left untouched.

## Order of execution
1. Migration 1 + Margin Notes UI.
2. Migration 2 + Reading Rooms UI (Presence/Broadcast).
3. Migration 3 + Spoiler-Safe Threads UI.
4. Migration 4 + `generate-reading-dna` edge function + DNA UI + Match chips.

Approve to start; each migration goes to you for review one at a time.
