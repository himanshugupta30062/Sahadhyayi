# Sahadhyayi Social Media — Product, UX and Innovation Blueprint

**Purpose:** Make Sahadhyayi feel as instantly understandable as Instagram while giving it a differentiated identity as a place where readers share the meaning books have in their lives.

**Source of truth:** This blueprint extends `docs/social-experience-implementation-plan.md` and the existing `docs/Sahadhyayi-Improvement-Implementation-Plan.md`. It is a product/UX plan, not a claim that the proposed UI or database features are already implemented.

## 1. Product principle: familiar shell, book-first soul

Use familiar social interaction patterns—one composer, readable feed cards, like/comment/share, direct messages, clear profile pages—but make the content model and the reason to return specifically literary.

A user should be able to understand the home screen in five seconds:
1. What are people sharing?
2. What can I share?
3. Which readers or books should I explore?
4. Where are my replies and conversations?

Do not put every capability in the main navigation. Keep advanced reading tools discoverable from the relevant book, post, or group.

### Proposed primary navigation

**Mobile bottom bar:** Home · Discover · Create · Inbox · Profile.

**Desktop:** compact top/side navigation with Home, Discover, Groups, Inbox, Profile; notifications in the header.

Within Home, use a simple segmented control: **For You · Following · Latest**. Each must have distinct query semantics, truthful loading/error/empty states, and tests. “Following” is a one-way follow graph, not mutual friendship. Do not surface posts to a user unless the existing audience/authorization rules permit them.

Move Reading Rooms, shared Marginalia, Spoiler-safe Threads, and Reading DNA into a “Reading Spaces” or Discover destination, with contextual links from books and posts. Preserve direct deep links such as `/social?tab=...` while gradually consolidating the current many-tab layout.

## 2. Recommended feed card system

Standardise every card around a small set of content types with consistent spacing, type scale, action placement, and mobile behavior.

### A. Text/reflection post
- Compact author row: avatar, name, handle, time, audience.
- Comfortable body typography with preserved line breaks.
- If book-linked, show a compact book chip/cover and “Discuss this book” path.
- Like, comment, save, repost, share in the same predictable row.
- Hide low-value metadata until needed; no fake engagement counts or “live” labels.

### B. Photo post — make the image the hero
- Edge-to-edge image within the card, with a stable aspect-ratio container and sensible object-fit.
- Use `object-contain` for book covers, scanned passages, and pages; use `object-cover` for lifestyle/scene photos only when cropping is safe.
- On tap, open a full-screen lightbox with swipe navigation, pinch/zoom where supported, keyboard Escape, close button, and image alt text.
- Show caption and optional linked book/quote as a separate layer beneath the photo; don’t force every photograph into a short, cropped square.
- Provide upload progress, thumbnail preview, remove/retry, accepted formats, file-size validation, compression, and clear upload errors. Keep a draft if upload fails.
- Make it easy to tag a book, add alt text, and choose audience before posting.
- Generate a smaller feed thumbnail and serve a larger image only in the viewer. Keep original upload private if the post audience is private; avoid using an unrestricted public storage URL for private posts.
- Allow 4:5 portrait, square, and landscape presentation; show the whole image by default when its content is a page or text.
- For multi-image posts, use a swipeable carousel with clear “2 of 5” progress and no unexpected crop.

### C. Book activity card
A reusable preview for reading progress, a review, a finished book, a TBR recommendation, or a reading milestone. Always use the canonical book record/cover and link to the book page. Make it visually distinct from a generic post without creating a different navigation system.

### D. Quote card (signature feature)
See section 3. It should feel like a shareable literary object, not a quotation pasted into a generic text post.

### E. Discussion prompt card
Support one strong question, book/chapter context, and replies. Apply spoiler visibility at the book/chapter level where possible. Hide the reveal behind a deliberate “Show spoiler” interaction.

## 3. Signature feature: “Quote, Meet Life” — a quote-to-moment story

The user’s idea: share a book quote, associate it with a person or situation, and share it as a link. Turn this into Sahadhyayi’s signature format.

### Composer flow: keep creation under a minute
1. Tap **Create**.
2. Choose **Quote** (or highlight text while reading and choose “Share as quote”).
3. Paste/type the quote or select a verified user-owned highlight.
4. Attach the source book and author; if unknown, mark the source as unverified instead of inventing attribution.
5. Choose a prompt: “This reminds me of…”, “I wish I could tell…”, “A moment in my life…”, “For someone who needs this…”, or “My interpretation”.
6. Optional connection: select a person from the user’s contacts/friends, or choose a non-identifying relationship/context (“a friend”, “my younger self”, “someone I miss”, “a difficult season”). Selecting a person must not automatically tag them publicly.
7. Pick a visual style and audience; preview the share card.
8. Share to the Sahadhyayi feed, send privately, copy a web link, or download an image.

Make every step optional beyond quote/source. The simplest flow is quote + book + share; context/person is a delightful enhancement, not a required form.

### Example presentation
> **“A line I needed today.”**  
> *[Reader’s selected quotation]*  
>  
> This reminds me of a conversation I had with a friend when I needed to hear the truth gently.  
>  
> **Source:** [Book title] · [Author]  
> **Shared by:** [Reader]

Do not prefill the quote with an invented famous line or attribute a quotation to an author without a reliable source. User-supplied quotes and brief excerpts should be handled with appropriate copyright limits; offer attribution and linking rather than encouraging uploads of long copyrighted passages.

### Quote-card art direction
Preserve Sahadhyayi’s forest-green, warm paper, and muted gold palette. Offer a few cohesive templates, not an overwhelming editor:
- **Library card:** archival checkout-card aesthetic with book/source metadata.
- **Quiet page:** warm paper, generous margins, book typography.
- **Night reader:** deep forest green, warm gold type.
- **Margin note:** quote plus handwritten-style reflection accent.
- **Photo + passage:** user photo as background only with a contrast-safe overlay and a preview crop.
- **Minimal type:** typography-first for long lines, no clutter.

Use a serif display face for the quote, a very readable sans-serif for supporting metadata, controlled line length, generous white space, and automatic layout based on quote length. Include author/book/source, Sahadhyayi mark, and optional handle in the exported image. Show a watermark toggle, but retain attribution metadata in the canonical page.

### Share link behavior
Each quote has a canonical URL that opens a mobile-first quote page with:
- the exact quote and any attribution verification status;
- its book/source link;
- the sharer’s context only if they chose to make it public;
- reactions and discussion permitted by its audience;
- a clear “Create your own quote card” action;
- appropriate Open Graph/social preview metadata.

Private quote cards must require authorization and must not leak context, tagged-person names, or photo URLs through metadata, previews, logs, or the public feed. Never infer that a person mentioned in a reflection has agreed to be tagged.

## 4. Additional differentiated ideas (prioritised)

### P0 — ship the basics correctly first
**1. A real Instagram-simple composer.** A single Create entry point with Text, Photo, Quote, Book, and Progress choices. Use progressive disclosure: show the minimum controls first, then advanced settings. Keep audience selection visible and explicit.

**2. Quote Studio + shareable public/private links.** Best signature feature to launch first after core feed reliability and authorization. Make quote cards useful outside Sahadhyayi as a distribution loop, with source metadata and an attribution-aware share page.

**3. Photo-first posting and viewer.** Reliable image upload, responsive image presentation, alt text, full-screen lightbox, multi-image support, upload retries and an image-processing path. Readers often photograph annotations, book stacks, marginalia, library finds, or reading spaces.

**4. Save to a private “Reading Cabinet”.** Save a post, quote, photo, review, or discussion to a personal collection; create private folders such as “Lines to remember”, “Books to gift”, “Ideas to revisit”, “For later”. This is a save/bookmark feature, not a public vanity counter.

**5. Better social notifications.** A coherent inbox-like notifications screen with grouped activity, mark-read controls, deep links, unread state, and correct actor/recipient semantics. Do not spam notifications for every repeated action.

### P1 — a community that feels literary
**6. “What this line means to me.”** Multiple readers can attach their own interpretation to the same quote without competing to own it. Each perspective becomes a branch, with the source quote as a shared anchor.

**7. Quote-to-book graph.** Clicking a quote reveals the book, author, associated topic/emotion, other public interpretations, and related quotes. Let users explore ideas through themes such as grief, courage, ambition, friendship, identity, or hope.

**8. “Read with me” micro-invites.** Invite 1–5 friends to read a chapter or a short reading session, select a date/time, and follow a tiny progress thread. Avoid building a heavy event planner in the first release.

**9. Spoiler-aware post labels.** A reader chooses book and spoiler scope (no spoilers / through chapter / full-book discussion). Make spoiler status visible on every feed card, and reveal only after the reader explicitly opts in.

**10. Book-to-person gifting.** Send a book recommendation, quote, or list to one person with a note such as “I thought of you because…”. The recipient can save it to their TBR and reply. Keep the action private by default.

**11. Reading moments / low-pressure stories.** Optional ephemeral posts like “reading now”, desk/book photos, current page, or a short thought. Expiration should be clear and configurable; permanent quotes/reflections should stay in the user’s archive if they choose.

### P2 — retain readers without empty gamification
**12. Reader identity card.** A profile with current reads, favourite genres, meaningful quote, shelves/lists, reviews, and opt-in milestones. Make private shelves and activity genuinely private, not just hidden in the UI.

**13. Reading recap cards.** Weekly/monthly reflection cards: books finished, pages read if actually tracked, favourite themes, saved quotations, reading-room participation, and a personal reflection. No fabricated activity or competitive ranking by default.

**14. “Find my book people.”** Reader recommendations based on overlapping books, explicitly selected genres/topics, follows, and shared groups. Explain why each person is suggested. Do not use exact geolocation as the default matching signal.

**15. Community bookshelf walls.** A group can pin a shared shelf, a quote of the week, a question, and its next read on one calm group home. Keep chat and documents secondary to the group’s reading purpose.

**16. Gentle reading prompts.** Optional prompts like “What line stayed with you today?” or “What changed your mind in your current book?” Provide dismiss and frequency controls. Avoid streak guilt or notifications that pressure people to read.

**17. Author/reader Q&A cards.** Structured questions attached to an author/book, with clear verified-author labels and moderation; strong long-term value but requires moderation workflow first.

## 5. Implementation audit: known code-level opportunities

These are grounded in the current code reviewed and should be rechecked against the current branch before implementation.

- The current Social Media route has a broad, multi-panel layout and several book-native feature tabs. The desktop sidebar repeats rooms/groups/readers and competes with the feed. Reduce visual competition; show 1–2 contextual modules and move the rest to Discover.
- The composer already supports text, one image, a selected book, a feeling, and an audience. Image upload goes through a general `books` storage bucket and uses a public URL. Before enhancing photos or quotes, confirm the bucket policies and make sure private-audience content cannot resolve to a publicly readable image.
- The feed supports post cards, comments, likes, reposts, sharing and has pagination/error handling work. Improve visual consistency and photo presentation before adding more action buttons.
- The Friends & Connections screen has Discover/Friends/Following/Requests tabs. Ensure the friend-profile fields exactly match the hook’s return shape; distinguish failures from genuinely empty lists; do not enable relationship actions when connection state cannot be verified.
- The map feature must be explicitly opt-in. Never request GPS on mount, never plot fake coordinates, and never return another person’s exact coordinates unless the secured endpoint and mutual-consent policy explicitly allow the intended experience.
- Existing quote/marginalia functionality means Quote Studio can reuse the concept of book-linked passages, but it should be a dedicated post type with its own visual export/share route rather than another generic tab.
- Preserve existing URL tab parameters while simplifying the layout. Keep the public/authenticated experience separate so signed-out visitors do not launch authenticated social queries.
- Keep post visibility rules, follows, and friendships distinct. Do not remove RLS to make a screen appear populated.
- The 5 MB image cap is a basic guard, not a full photo pipeline: check MIME type and dimensions, handle SVG/animated formats deliberately, resize/compress client-side when sensible, strip EXIF/GPS metadata where practical, and protect private media.
- Add report/block/mute and moderation flows alongside growth features, before inviting large-scale public photo sharing.

## 6. Proposed feed visual system

- Canvas: warm paper background; cards white/off-white with fine warm borders; forest-green primary actions; restrained gold accent for quote/source details.
- Typography: use a strong serif only for quote/book moments, and accessible sans-serif for buttons, metadata and long conversation text.
- Spacing: one predictable card rhythm; avoid nested card borders. Give images and quote art enough area to breathe.
- Actions: like, comment, save, repost, share. Put secondary actions into a compact overflow menu. Never use ambiguous unlabeled icons without accessible names.
- Feed width: preserve a readable central measure (roughly 620–720px for desktop feed content) and avoid a very wide stream that stretches body text.
- Desktop: optional narrow contextual rail; collapse it at medium widths.
- Mobile: one-column content, bottom Create entry point, full-width photo viewer, thumb-friendly controls and no sideways overflow.
- Loading: stable skeleton cards that reserve image aspect ratios.
- Errors: retry action and plain-language message; never turn a failed request into “nothing here”.
- Empty state: explain why the area is empty and offer one sensible next action.
- Accessibility: keyboard and screen-reader support, visible focus, contrast, reduced motion, image alt text, semantic buttons, and no interaction that depends only on hover.

## 7. Suggested rollout

**Sprint A — reliability and layout**
- Finish feed/friends/search error states and authorization tests.
- Reduce duplicate sidebar modules; unify mobile and desktop navigation.
- Audit storage bucket policies and post-audience/RLS alignment.
- Add event instrumentation for post created, quote shared, photo viewed, save, reply, follow, and share-link open.

**Sprint B — quote MVP**
- Define a canonical quote-card data model (source book/author, exact text, context, optional person reference with consent, audience, style template, attribution status).
- Build Create Quote flow with 3 templates, source selection, context prompt, preview, audience selection and export.
- Build responsive permalink and social preview.
- Add tests for public/private visibility, access control, attribution state, malformed inputs, and share-link behavior.

**Sprint C — polished photo sharing**
- Add validated image pipeline, preview/crop, accessible full-screen viewer, alt text, multi-image carousel and safe private storage.
- Build media cleanup for abandoned/failed drafts without breaking live post attachments.
- Verify mobile performance with representative large photos and slow connections.

**Sprint D — collections and reader graph**
- Build private Reading Cabinet, quote interpretation threads, theme tags and explanation-based reader discovery.
- Only add stories/ephemeral posts after the ordinary feed and notifications are reliable.

## 8. Success measures

Measure a baseline before setting numeric goals:
- time from Create tap to successful post;
- photo/quote upload and publish success rate;
- share-link open-to-signup or open-to-save conversion (respect privacy and consent);
- quote-card saves and shares, replies per quote;
- first-week meaningful action (follow, save, share a quote, join a group);
- feed load success rate, p95 latency, image load failures;
- accessibility and mobile overflow defects;
- report resolution time and block/mute effectiveness.

Do not optimize for outrage, unlimited scrolling, fake activity, or public follower counts at the expense of thoughtful reading.

## 9. Acceptance checklist

- [ ] A first-time user can view the feed, understand Create, and share a quote without training.
- [ ] The quote card has verified/unknown attribution handling and links to its source.
- [ ] A public quote link reveals only public context and metadata.
- [ ] A private quote/photo/post cannot be accessed through direct URL, preview metadata, API query or storage URL by an unauthorized viewer.
- [ ] Photos display without destructive cropping, can be opened full-screen, and have alt text.
- [ ] Feed filters correspond to real query/authorization semantics.
- [ ] Follow and friend status remain separate.
- [ ] All network-backed panels have distinct loading, error, retry, and successful-empty states.
- [ ] Mobile navigation, keyboard access, screen-reader labels and reduced-motion behavior are tested.
- [ ] Build, lint, unit, authorization and end-to-end checks pass before merge/deployment.
