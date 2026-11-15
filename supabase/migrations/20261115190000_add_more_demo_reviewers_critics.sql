-- Add more clearly fictional sample reviewers and critics for directory filters.
-- Demo profiles are intentionally unverified and not featured.
insert into public.literary_creators (
 id,name,slug,bio,avatar_url,creator_roles,genres,languages,website_url,
 featured,verified,status,created_at
) values
(
 '00000000-0000-0000-0000-000000000020',
 'Meera Nair Reads',
 'demo-meera-nair-reads',
 '[SAMPLE PROFILE] Fictional reviewer writing thoughtful, spoiler-conscious reviews of contemporary Indian fiction, family sagas, and translated novels.',
 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
 array['reviewer'],array['Indian Fiction','Family Sagas','Translation'],array['English','Malayalam'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000021',
 'The Quiet Chapter',
 'demo-quiet-chapter',
 '[SAMPLE PROFILE] Fictional reviewer championing slow reads, classics, reflective essays, and books that reward rereading.',
 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80',
 array['reviewer','blogger'],array['Classics','Essays','Literary Fiction'],array['English'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000022',
 'Rohan Book Notes',
 'demo-rohan-book-notes',
 '[SAMPLE PROFILE] Fictional critic offering accessible analysis of character, narrative craft, themes, and memorable passages without spoiling endings.',
 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
 array['critic','reviewer'],array['Literary Analysis','Modern Fiction','Narrative Craft'],array['English','Hindi'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000023',
 'Kavya Poetry Desk',
 'demo-kavya-poetry-desk',
 '[SAMPLE PROFILE] Fictional poetry critic exploring imagery, rhythm, voice, and contemporary poetry across Indian languages and translations.',
 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
 array['critic','reviewer'],array['Poetry','Literary Criticism','Indian Languages'],array['English','Hindi'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000024',
 'Fact & Footnotes',
 'demo-fact-and-footnotes',
 '[SAMPLE PROFILE] Fictional nonfiction reviewer evaluating research, clarity, evidence, and storytelling in science, history, psychology, and biography.',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
 array['reviewer','critic'],array['Non-fiction','Science','History','Biography'],array['English'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000025',
 'Aditi’s Story Shelf',
 'demo-aditis-story-shelf',
 '[SAMPLE PROFILE] Fictional reviewer spotlighting debut authors, regional writing in translation, and overlooked books from independent publishers.',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
 array['reviewer','bookstagrammer'],array['Debut Fiction','Regional Literature','Indie Books'],array['English','Hindi'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000026',
 'The Critical Marginalia',
 'demo-critical-marginalia',
 '[SAMPLE PROFILE] Fictional literary critic connecting philosophy, history, and close reading to ask what a book says—and how it says it.',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
 array['critic','blogger'],array['Philosophy','Classics','Literary Theory'],array['English'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000027',
 'Weekend Chapter Club',
 'demo-weekend-chapter-club',
 '[SAMPLE PROFILE] Fictional BookTuber hosting approachable reading wrap-ups, themed reading lists, and community buddy-read discussions.',
 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=400&q=80',
 array['booktuber','reviewer'],array['Fantasy','Mystery','Community Reads'],array['English'],
 'https://youtube.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000028',
 'Between Two Covers India',
 'demo-between-two-covers-india',
 '[SAMPLE PROFILE] Fictional Indian Bookstagram voice sharing mini-reviews, regional reading lists, and shelf discoveries from Indian publishers.',
 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
 array['bookstagrammer','reviewer'],array['Indian Publishers','Contemporary Fiction','Regional Literature'],array['English','Hindi'],
 'https://instagram.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000029',
 'Plot & Perspective',
 'demo-plot-and-perspective',
 '[SAMPLE PROFILE] Fictional critic comparing narrative choices, pacing, point of view, and adaptation possibilities in novels and short stories.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
 array['critic','reviewer'],array['Short Stories','Narrative Craft','Contemporary Fiction'],array['English'],
 'https://example.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000030',
 'New Leaf Reviews',
 'demo-new-leaf-reviews',
 '[SAMPLE PROFILE] Fictional emerging reviewer sharing first impressions, reader-friendly ratings, and thoughtful recommendations for new releases.',
 'https://images.unsplash.com/photo-1598550874833-fa5ab191101b?auto=format&fit=crop&w=400&q=80',
 array['reviewer','booktok'],array['New Releases','Young Adult','Romance'],array['English'],
 'https://tiktok.com/',false,false,'published',now()
)
on conflict (slug) do update set
 name=excluded.name,bio=excluded.bio,avatar_url=excluded.avatar_url,
 creator_roles=excluded.creator_roles,genres=excluded.genres,languages=excluded.languages,
 website_url=excluded.website_url,featured=excluded.featured,verified=excluded.verified,
 status=excluded.status,updated_at=now();
