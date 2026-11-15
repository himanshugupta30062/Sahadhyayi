-- Expand sample creator coverage for the BookTuber and Bookstagram sub-filters.
-- Clearly fictional demo profiles; do not present as real/verified creators.
insert into public.literary_creators (
  id,name,slug,bio,avatar_url,creator_roles,genres,languages,website_url,
  featured,verified,status,created_at
) values
(
 '00000000-0000-0000-0000-000000000016',
 'Ananya Reads',
 'demo-ananya-reads',
 '[SAMPLE PROFILE] Indian BookTuber sharing Hindi and English reading vlogs, monthly wrap-ups, author spotlights, and beginner-friendly recommendations.',
 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
 array['booktuber','reviewer'],array['Indian Literature','Contemporary Fiction','Book Vlogs'],array['English','Hindi'],
 'https://youtube.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000017',
 'The Paperback Project',
 'demo-paperback-project',
 '[SAMPLE PROFILE] A fictional channel exploring classics, translated fiction, thoughtful reading challenges, and spoiler-free book reviews.',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
 array['booktuber','blogger'],array['Classics','Translated Fiction','Literary Fiction'],array['English'],
 'https://youtube.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000018',
 'Pages & Chai',
 'demo-pages-and-chai',
 '[SAMPLE PROFILE] Fictional Bookstagram creator pairing cozy reading corners with honest mini-reviews of Indian authors, poetry, and contemporary novels.',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
 array['bookstagrammer','reviewer'],array['Indian Literature','Poetry','Contemporary Fiction'],array['English','Hindi'],
 'https://instagram.com/',false,false,'published',now()
),
(
 '00000000-0000-0000-0000-000000000019',
 'Shelf in Bloom',
 'demo-shelf-in-bloom',
 '[SAMPLE PROFILE] Fictional literary photographer creating book flatlays, reading mood boards, and short reviews of fantasy, romance, and indie publications.',
 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
 array['bookstagrammer','booktok'],array['Fantasy','Romance','Independent Publishing'],array['English'],
 'https://instagram.com/',false,false,'published',now()
)
on conflict (slug) do update set
 name=excluded.name,bio=excluded.bio,avatar_url=excluded.avatar_url,
 creator_roles=excluded.creator_roles,genres=excluded.genres,languages=excluded.languages,
 website_url=excluded.website_url,featured=excluded.featured,verified=excluded.verified,
 status=excluded.status,updated_at=now();
