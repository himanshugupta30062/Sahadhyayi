

# Cover Quality Ranking and Loading Speed

## What changes

### 1. New utility: `src/utils/normalizeCoverUrl.ts`
Treats `''`, `'null'`, `'undefined'` as `null` so empty-string covers move to the no-cover tier.

### 2. New utility: `src/utils/getCoverQualityScore.ts`
Source-based scoring: Supabase → +500, OpenLibrary large → +400, Google Books → +200, other → +100, none → 0.

### 3. Update `src/hooks/useLibraryBooks.ts`
- Import `normalizeCoverUrl` and `getCoverQualityScore`
- In `getBookCompletenessScore`: normalize the cover URL first, then add `getCoverQualityScore(url)` on top of the base +2000 for having a cover
- Update `SORTING_RULES` to include "High-res cover source" entry

### 4. Update `src/hooks/usePaginatedLibraryBooks.ts`
- Use `normalizeCoverUrl` in the tier split so `''` covers go to noCover tier
- After slicing paginated books, preload the first 8 cover URLs via `new Image()` in a `useEffect`

### 5. Update `src/components/library/SortingInfoTooltip.tsx`
Automatically reflects updated `SORTING_RULES` — just needs the new rule added in step 3.

## What we skip
- **Async image resolution scoring** — loading every image to measure pixels before sorting would block rendering and defeat the speed goal. Source-based heuristic is sufficient.
- **`getFinalCoverScore.ts`** — unnecessary indirection; the score is computed inline in `getBookCompletenessScore`.

## Files
| File | Action |
|------|--------|
| `src/utils/normalizeCoverUrl.ts` | Create |
| `src/utils/getCoverQualityScore.ts` | Create |
| `src/hooks/useLibraryBooks.ts` | Edit scoring + rules |
| `src/hooks/usePaginatedLibraryBooks.ts` | Edit tier split + preload |

