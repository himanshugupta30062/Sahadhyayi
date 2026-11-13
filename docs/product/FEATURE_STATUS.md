# Sahadhyayi — Feature Status Document

## System Health & Status Matrix

*Last Updated: 2026-11-13*

### 1. Reading Tracker & Bookshelf
- [x] **Up Next Reading Queue**: Prioritized 5-book list with reordering, quick start reading, and status indicators. (`feat/bookshelf-dnf-and-up-next-queue`)
- [x] **DNF (Did Not Finish) Support**: Tracking abandonment date, reason, pages read before abandoning, and distinct analytics separation. (`feat/bookshelf-dnf-and-up-next-queue`)
- [ ] **Reading Progress Synchronization**: Single canonical progress model connecting Book Reader, Shelf, and Stats. (In Progress)
- [ ] **Reading Import & Export**: Comprehensive import for Goodreads CSV, StoryGraph CSV, Generic CSV, and JSON backup; Export to Bookshelf CSV, History CSV, Reviews CSV, Journal Markdown, and JSON. (Under Active Development)
- [ ] **Edition & Series Tracking**: Series order display, preferred format selector (Paperback/Hardcover/Ebook/Audiobook). (Planned)

### 2. Reading DNA & Reader Discovery
- [x] **Reading Taste Vector Engine**: Jaccard genre overlap and cosine mood similarity. (`src/lib/readingDna.ts`)
- [x] **Granular 3-Way Privacy**: `public`, `friends`, `private` backed by database constraint, RLS policy, and RPC. (`feat/reading-dna-discovery`)
- [x] **Natural Language Compatibility**: Contextual taste explanations and confidence levels (`high`, `moderate`, `emerging`). (`feat/reading-dna-discovery`)
- [x] **Public Reader Discovery Interface**: Search, match threshold filters, genre chips, pace chips, profile preview modal, and friend connection. (`feat/reading-dna-discovery`)

### 3. Reading Goals & Analytics
- [x] **Personal Reading Goals**: Multi-metric goals (books, pages, minutes, streaks) with live pace and required daily pacing calculators. (`feat/reading-goals-achievements-momentum`)
- [x] **Progressive Achievements**: Tiered badges, category filters, and closest locked milestone tracking. (`feat/reading-goals-achievements-momentum`)
- [x] **Reading Momentum Widget**: 30-day velocity metric on user profiles. (`feat/reading-goals-achievements-momentum`)
- [x] **Shareable Reading Passport**: Privacy-safe literary stamps and recap generator. (`feat/reading-goals-achievements-momentum`)
- [x] **Reading Activity Heatmap**: Daily reading consistency calendar. (`merged in PR #1672`)

### 4. Reading Journal
- [x] **Tags and Pinning**: Priority journal entries and tag categorization. (`merged in PR #1663` / `#1674`)
- [x] **Journal Collections & Folders**: Custom folder organization, entry assignment, folder stats, rename/delete. (`feat/reading-journal-collections`)

### 5. Social & Community
- [x] **Book Reels Experience**: 10-second video playback, progress bar, completion detection, replay, and duration badges. (`feature/book-reels-playback-progress`)
- [x] **Community Pulse**: Real-time public reading updates stream on homepage. (`merged`)
- [ ] **Buddy Reads**: Dedicated 1-on-1 and small group reading rooms with milestone pacing. (Planned)
- [ ] **Spoiler-Gated Discussions**: Progress-aware blur and spoiler tagging in reading group discussions. (Planned)

### 6. Readers Map
- [x] **Map Discovery Actions**: Reader popover with DNA compare, profile inspect, and friend request. (`merged in PR #1676`)
- [x] **Location Privacy Safeguards**: Approximate coordinates, city-level opt-in, strict RLS. (`src/components/maps/`)
