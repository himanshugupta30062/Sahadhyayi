
# Sahadhyayi — App Improvement Plan

**Sprint 1 status: shipped.** Bookshelf redesign, BookDetails guest CTA, book data fix, and Home page consolidation are live. **Phase 2 progress:** onboarding checklist (Dashboard) and URL-persisted library filters shipped. Remaining: typo-tolerant ranking, personalized "For you" rail, reading streaks.

Based on a sweep of the codebase (45+ pages, hooks, Supabase functions, prior `.lovable/plan.md`, and the roadmap in `docs/Sahadhyayi-Improvement-Implementation-Plan.md`), here is a prioritized plan focused on real, observable gaps rather than rewrites.

## Phase 1 — Quick wins (1–2 sprints)

### 1. Home page declutter (`/`)
- Split logged-in vs logged-out hero. Logged-in users see Dashboard summary + CurrentReads at the top, not buried below marketing.
- Collapse the 4 overlapping "What is / Revives / Tools / Platform" sections into one tabbed value-prop block.
- Remove the giant-icon "Explore Platform" grid; replace with a compact link strip.
- Trim "Sahadhyayi" keyword repetition in copy to natural frequency.

### 2. Bookshelf redesign (`/bookshelf`)
- Add status tabs: All / Currently Reading / Want to Read / Completed.
- Stats header: books completed, pages read, streak, goal progress (computed from `useUserBookshelf`).
- Enhanced cards: progress bar, status badge, last-read date, quick actions.
- Empty state: illustration + "Browse Library" CTA + 3 popular suggestions.

### 3. Guest experience polish
- BookDetails: add a dedicated "Sign in to read / save / discuss" CTA card above tabs.
- Confirm Reading Groups and SocialMedia guest CTAs render consistently (already partially done).

### 4. Data hygiene
- Fix swapped title/author on book `a6539dc3-cc6c-4991-908c-c5b4d214bcbd` via migration.
- Add a one-off check script for obviously inverted title/author pairs.

## Phase 2 — Engagement & discovery (2–4 sprints)

### 5. Search & filters upgrade
- Library: language, reading level, length, availability filters; typo-tolerant ranking on title+author+keyword.
- Persist filter state in URL for shareable searches.

### 6. Personalized recommendations
- Blend saved/read books, follows, group activity, and trending into a "For you" rail on Home + Discovery.
- Show transparent "Why this?" labels.

### 7. Reading goals & streaks
- Yearly goal setting on Dashboard with progress ring.
- Daily streak indicator; non-gamified toggle in profile settings.

### 8. Onboarding checklist
- Dashboard widget: complete profile → follow an author → save first book → join a group.
- Dismissible, tracked via a small `onboarding_progress` table.

## Phase 3 — Trust, performance, platform (1–2 months)

### 9. Performance pass
- Route-level code splitting for heavy pages (Map, Games, Articles editor).
- Image work already in place (EnhancedLazyImage); audit hero/LCP images on Home, Library, Authors.
- Bundle/CWV budgets in CI.

### 10. Community safety
- Report UI on posts/comments/groups; moderation queue page for admins (uses existing `app_role`).
- Rate-limit comments/posts via existing `rate_limits` table.

### 11. Author & creator tools
- Author analytics: reads/saves per book, follower growth.
- Schedule publication dates for articles and books.

### 12. SEO & accessibility
- Add Book/Author/Article/Breadcrumb JSON-LD on detail pages.
- WCAG 2.2 AA sweep: focus states, contrast (axe is already flagging issues), keyboard nav, ARIA on dropdowns/menus.

## Cross-cutting

- **Instrumentation first**: define analytics events for onboarding, search, reading progress, community actions before rolling out Phase 2.
- **Feature flags**: gate Phase 2/3 features for safe rollback.
- **Vertical slices**: ship each item as UI + backend + analytics + QA together.

## Suggested first sprint (concrete, ready to build)

1. Bookshelf tabs + stats header + enhanced cards (Phase 1.2).
2. Home page consolidation + logged-in/out split (Phase 1.1).
3. BookDetails guest CTA card (Phase 1.3).
4. Migration to fix the swapped book record (Phase 1.4).

Tell me which sprint to start with — or pick a subset — and I'll implement it.
