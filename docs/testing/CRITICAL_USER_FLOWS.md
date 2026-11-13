# Sahadhyayi — Critical User Flows & Quality Assurance Playbook

## 1. Scope & Test Matrix
This document outlines the validation rules for critical paths on Sahadhyayi. All pull requests touching these domains must satisfy corresponding automated tests and zero-lint errors.

---

### Flow 1: Bookshelf Management & DNF Lifecycle
1. User logs in.
2. Navigates to book details or library.
3. Updates shelf status to `want_to_read`, `reading`, `read`, or `dnf`.
4. Marking as DNF opens `DnfBookDialog`:
   - Validates optional reason (e.g., "Pacing too slow", "Did not connect with characters").
   - Records page/percentage progress when abandoned.
   - Saves record without counting toward completed yearly reading goals.
5. Up Next Queue:
   - User adds book to Up Next queue (capped at 5).
   - User reorders priority via drag-and-drop or order arrows.
   - User promotes top queued book directly to Currently Reading.

---

### Flow 2: Data Mobility & Library Migration
1. **Importing from Goodreads / StoryGraph / CSV**:
   - User uploads `goodreads_library_export.csv` or `storygraph_export.csv`.
   - File is parsed client-side with RFC 4180 parsing and CSV formula injection sanitization.
   - Catalog matcher cross-references ISBN-13, ISBN-10, and normalized title/author.
   - Displays preview table showing:
     - Matched books (ready to import).
     - New books to register in personal catalog.
     - Ambiguous matches with manual selection.
   - Batch import updates bookshelf status, personal ratings (1-5), dates read, and reviews.
2. **Exporting Personal Reading History**:
   - User selects export format: Bookshelf CSV, Full Reading History CSV, Reviews CSV, Reading Journal Markdown, or Complete JSON Backup.
   - Download initiates with correct MIME types and UTF-8 BOM encoding for Microsoft Excel compatibility.

---

### Flow 3: Reading DNA & Taste Matching
1. User completes or updates Reading DNA.
2. Privacy toggle allows setting `public`, `friends`, or `private`.
3. Discover Readers view searches public readers:
   - Excludes self, existing friends, blocked users, and pending requests.
   - Displays match percentage, confidence tier badge, shared genres, and natural explanation.
4. DNA Compare modal opens showing shared books with respective user ratings.

---

### Flow 4: Location & Community Safety on Readers Map
1. Readers Map requires explicit opt-in before requesting location.
2. Selected location is clustered to city/approximate centroid with $\ge 1.5\text{km}$ jitter.
3. Clicking a reader pin displays discovery actions: Profile view, DNA compare, and friend request.
4. Opting out immediately removes the location record from the database.

---

### Flow 5: Book Reels & Social Feed
1. User browses Book Reels strip on feed or book page.
2. Video reels display HTML5 player with 10s progress indicator and elapsed time.
3. Upon reaching $\ge 90\%$ playback or conclusion, marks reel completed with instant replay button.
4. Keyboard navigation (ArrowLeft/ArrowRight) allows cycling reels without interfering with comment inputs.
