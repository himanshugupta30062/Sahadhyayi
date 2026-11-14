-- Seed sample literary creators for the Reviewers & Critics directory
-- These are curated literary voices across different roles and genres

insert into public.literary_creators (
  id,
  name,
  slug,
  bio,
  avatar_url,
  creator_roles,
  genres,
  languages,
  website_url,
  featured,
  verified,
  status,
  created_at
) values
-- Featured creators
(
  '00000000-0000-0000-0000-000000000001',
  'Priya Sharma',
  'priya-sharma',
  'Literary critic and essayist focusing on South Asian literature, postcolonial narratives, and contemporary fiction. Regular contributor to The Hindu Literary Review and Scroll.in. Author of "Reading Between Lines: Essays on Modern Indian Fiction."',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  array['critic', 'reviewer'],
  array['Literary Fiction', 'South Asian Literature', 'Postcolonial Studies', 'Essays'],
  array['English', 'Hindi'],
  'https://priyasharmawrites.com',
  true,
  true,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Marcus Chen',
  'marcus-chen',
  'BookTuber and content creator with 150K+ subscribers. Specializes in speculative fiction, sci-fi/fantasy deep dives, and author interviews. Host of "Beyond the Cover" YouTube channel and "Page Turners" podcast.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  array['booktuber', 'reviewer'],
  array['Science Fiction', 'Fantasy', 'Speculative Fiction', 'Graphic Novels'],
  array['English', 'Mandarin'],
  'https://youtube.com/@marcuschendreads',
  true,
  true,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000003',
  'Dr. Amara Okafor',
  'amara-okafor',
  'Professor of African Literature at University of Lagos. Award-winning literary critic specializing in African diaspora literature, oral traditions in modern fiction, and decolonial reading practices. Author of three academic monographs.',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  array['critic', 'reviewer'],
  array['African Literature', 'Diaspora Studies', 'Postcolonial Fiction', 'Oral Literature'],
  array['English', 'Yoruba', 'Igbo'],
  'https://unilag.edu.ng/amara-okafor',
  true,
  true,
  'published',
  now()
),
-- Reviewers
(
  '00000000-0000-0000-0000-000000000004',
  'James Morrison',
  'james-morrison',
  'Professional book reviewer for Kirkus Reviews and BookPage. Focus on mystery, thriller, and crime fiction. Former bookseller with 15 years in the industry. Runs the "Noir & More" newsletter.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  array['reviewer'],
  array['Mystery', 'Thriller', 'Crime Fiction', 'Noir'],
  array['English'],
  'https://noirmore.substack.com',
  false,
  true,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000005',
  'Elena Rodríguez',
  'elena-rodriguez',
  'Bilingual book reviewer covering Latin American literature in translation and Spanish-language originals. Contributor to Words Without Borders and Latin American Literature Today. Passionate about indigenous voices.',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  array['reviewer'],
  array['Latin American Literature', 'Translation', 'Magical Realism', 'Indigenous Voices'],
  array['Spanish', 'English', 'Portuguese'],
  'https://elenarodriguezreads.com',
  false,
  true,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000006',
  'David Park',
  'david-park',
  'Freelance reviewer for The Guardian, Financial Times, and TLS. Specializes in literary fiction, translated works, and experimental narratives. Former editor at a major publishing house.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  array['reviewer', 'critic'],
  array['Literary Fiction', 'Translation', 'Experimental Fiction', 'Modern Classics'],
  array['English', 'French', 'German'],
  'https://davidparkcritic.com',
  false,
  false,
  'published',
  now()
),
-- Critics
(
  '00000000-0000-0000-0000-000000000007',
  'Prof. Sarah Whitaker',
  'sarah-whitaker',
  'Professor of Comparative Literature at Columbia University. Leading voice in contemporary literary theory, ecocriticism, and climate fiction. Regular contributor to London Review of Books and The New Yorker.',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  array['critic'],
  array['Literary Theory', 'Ecocriticism', 'Climate Fiction', 'Modernism'],
  array['English', 'French'],
  'https://columbia.edu/swhitaker',
  false,
  true,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000008',
  'Dr. Rajesh Kumar',
  'rajesh-kumar',
  'Literary historian and critic specializing in Sanskrit poetics, classical Indian aesthetics, and their influence on modern Indian writing. Author of "The Rasa Theory in Contemporary Fiction."',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  array['critic'],
  array['Classical Indian Literature', 'Sanskrit Poetics', 'Literary Theory', 'Indian Aesthetics'],
  array['English', 'Hindi', 'Sanskrit'],
  'https://rajeshkumar.ac.in',
  false,
  true,
  'published',
  now()
),
-- BookTubers
(
  '00000000-0000-0000-0000-000000000009',
  'Sofia Andersson',
  'sofia-andersson',
  'BookTuber and Bookstagrammer from Stockholm. Known for cozy fantasy recommendations, Nordic noir deep dives, and beautiful aesthetic reading vlogs. 80K YouTube subscribers, 120K Instagram followers.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  array['booktuber', 'bookstagrammer'],
  array['Fantasy', 'Nordic Noir', 'Cozy Fantasy', 'Romance'],
  array['Swedish', 'English'],
  'https://youtube.com/@sofiareads',
  false,
  true,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000010',
  'Alex Kim',
  'alex-kim',
  'BookTok creator with 200K+ followers. Quick, engaging reviews of new releases, backlist gems, and diverse voices. Advocate for Asian representation in publishing. Hosts monthly buddy reads.',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=400&q=80',
  array['booktok', 'reviewer'],
  array['Contemporary Fiction', 'Romance', 'Asian Literature', 'New Releases'],
  array['English', 'Korean'],
  'https://tiktok.com/@alexkimreads',
  false,
  true,
  'published',
  now()
),
-- Bookstagrammers
(
  '00000000-0000-0000-0000-000000000011',
  'Maria Santos',
  'maria-santos',
  'Bookstagrammer and literary photographer from Lisbon. Curates beautiful flatlays featuring Portuguese and Brazilian literature, translated works, and small press gems. 95K Instagram followers.',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  array['bookstagrammer', 'reviewer'],
  array['Portuguese Literature', 'Brazilian Literature', 'Translation', 'Small Press'],
  array['Portuguese', 'English', 'Spanish'],
  'https://instagram.com/mariasantosreads',
  false,
  false,
  'published',
  now()
),
-- Bloggers
(
  '00000000-0000-0000-0000-000000000012',
  'Thomas Berger',
  'thomas-berger',
  'Literary blogger running "The Reading Life" since 2012. Long-form reviews, reading journals, and essays on the craft of reading. Focus on European literature in translation, philosophy, and poetry.',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  array['blogger', 'reviewer'],
  array['European Literature', 'Translation', 'Philosophy', 'Poetry', 'Essays'],
  array['English', 'German', 'French', 'Italian'],
  'https://thereadinglife.blog',
  false,
  false,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000013',
  'Aisha Hassan',
  'aisha-hassan',
  'Book blogger and diversity in publishing advocate. Reviews focus on OwnVoices narratives, marginalized authors, and inclusive storytelling. Runs the "Diverse Bookshelf" blog and newsletter.',
  'https://images.unsplash.com/photo-1598550874833-fa5ab191101b?auto=format&fit=crop&w=400&q=80',
  array['blogger', 'reviewer'],
  array['OwnVoices', 'Diverse Fiction', 'Contemporary', 'YA', 'Memoir'],
  array['English', 'Arabic'],
  'https://diversebookshelf.com',
  false,
  true,
  'published',
  now()
),
-- Additional creators for breadth
(
  '00000000-0000-0000-0000-000000000014',
  'Kenji Tanaka',
  'kenji-tanaka',
  'Japanese literature specialist and translator. Reviews contemporary Japanese fiction in translation and original language. Columnist for The Japan Times literary section.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  array['reviewer', 'critic'],
  array['Japanese Literature', 'Translation', 'Contemporary Fiction', 'Manga'],
  array['Japanese', 'English'],
  'https://kenjitanaka.jp',
  false,
  false,
  'published',
  now()
),
(
  '00000000-0000-0000-0000-000000000015',
  'Fatima Al-Zahra',
  'fatima-al-zahra',
  'Middle Eastern literature critic and Arabic-English translator. Focus on modern Arabic novel, women writers, and diaspora narratives. Contributor to Banipal and ArabLit.',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  array['critic', 'reviewer'],
  array['Arabic Literature', 'Women Writers', 'Diaspora', 'Translation'],
  array['Arabic', 'English', 'French'],
  'https://fatimaalzahra.com',
  false,
  true,
  'published',
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  creator_roles = excluded.creator_roles,
  genres = excluded.genres,
  languages = excluded.languages,
  website_url = excluded.website_url,
  featured = excluded.featured,
  verified = excluded.verified,
  status = excluded.status,
  updated_at = now();

-- Add sample social links for featured creators
insert into public.creator_social_links (creator_id, platform, label, handle, url, sort_order)
select id, platform, label, handle, url, sort_order
from (values
  ('00000000-0000-0000-0000-000000000001', 'x', 'Twitter', 'priyasharma', 'https://x.com/priyasharma', 1),
  ('00000000-0000-0000-0000-000000000001', 'website', 'Website', 'priyasharmawrites', 'https://priyasharmawrites.com', 2),
  ('00000000-0000-0000-0000-000000000002', 'youtube', 'YouTube', 'marcuschendreads', 'https://youtube.com/@marcuschendreads', 1),
  ('00000000-0000-0000-0000-000000000002', 'x', 'Twitter', 'marcuschend', 'https://x.com/marcuschend', 2),
  ('00000000-0000-0000-0000-000000000003', 'x', 'Twitter', 'amara_okafor', 'https://x.com/amara_okafor', 1),
  ('00000000-0000-0000-0000-000000000003', 'website', 'University Profile', 'unilag', 'https://unilag.edu.ng/amara-okafor', 2),
  ('00000000-0000-0000-0000-000000000004', 'x', 'Twitter', 'noirmore', 'https://x.com/noirmore', 1),
  ('00000000-0000-0000-0000-000000000004', 'substack', 'Newsletter', 'noirmore', 'https://noirmore.substack.com', 2),
  ('00000000-0000-0000-0000-000000000009', 'instagram', 'Instagram', 'sofiareads', 'https://instagram.com/sofiareads', 1),
  ('00000000-0000-0000-0000-000000000009', 'youtube', 'YouTube', 'sofiaandersson', 'https://youtube.com/@sofiaandersson', 2),
  ('00000000-0000-0000-0000-000000000010', 'tiktok', 'TikTok', 'alexkimreads', 'https://tiktok.com/@alexkimreads', 1),
  ('00000000-0000-0000-0000-000000000010', 'x', 'Twitter', 'alexkimreads', 'https://x.com/alexkimreads', 2),
  ('00000000-0000-0000-0000-000000000011', 'instagram', 'Instagram', 'mariasantosreads', 'https://instagram.com/mariasantosreads', 1),
  ('00000000-0000-0000-0000-000000000012', 'website', 'Blog', 'thereadinglife', 'https://thereadinglife.blog', 1),
  ('00000000-0000-0000-0000-000000000013', 'website', 'Blog', 'diversebookshelf', 'https://diversebookshelf.com', 1),
  ('00000000-0000-0000-0000-000000000013', 'x', 'Twitter', 'aishahassan', 'https://x.com/aishahassan', 2)
) as v(creator_id, platform, label, handle, url, sort_order)
on conflict do nothing;

-- Add sample publications for featured creators
insert into public.creator_publications (creator_id, title, publication_type, source_url, excerpt, published_at, status)
select creator_id, title, publication_type, source_url, excerpt, published_at::timestamptz, status
from (values
  ('00000000-0000-0000-0000-000000000001', 'The Architecture of Memory in Arundhati Roy''s The God of Small Things', 'criticism', 'https://thehindu.com/literary-review/roy-god-of-small-things', 'Roy''s novel constructs memory not as a passive repository but as an active, contested space...', '2024-01-15', 'published'),
  ('00000000-0000-0000-0000-000000000001', 'Review: The Covenant of Water by Abraham Verghese', 'review', 'https://scroll.in/article/covenant-of-water-review', 'Verghese returns with an epic that spans generations, geography, and the quiet persistence of faith...', '2024-05-20', 'published'),
  ('00000000-0000-0000-0000-000000000002', 'Why Fourth Wing Is the Fantasy Phenomenon We Needed', 'video', 'https://youtube.com/watch?v=abc123', 'Breaking down the romantic fantasy boom and why Rebecca Yarros struck gold...', '2024-06-10', 'published'),
  ('00000000-0000-0000-0000-000000000002', 'Interview: Tamsyn Muir on The Locked Tomb Series', 'video', 'https://youtube.com/watch?v=def456', 'Deep dive into necromancy, lesbian necromancers, and the genius of Gideon the Ninth...', '2024-03-15', 'published'),
  ('00000000-0000-0000-0000-000000000003', 'Oral Tradition as Resistance in Contemporary Nigerian Fiction', 'criticism', 'https://lrb.co.uk/okafor-oral-tradition', 'How writers like Chimamanda Ngozi Adichie and Ayọ̀bámi Adébáyọ̀ reclaim oral forms...', '2024-02-28', 'published'),
  ('00000000-0000-0000-0000-000000000007', 'Climate Fiction and the Anthropocene Novel', 'essay', 'https://newyorker.com/climate-fiction-anthropocene', 'The novel as a form is uniquely positioned to render the unthinkable scale of planetary change...', '2024-04-12', 'published'),
  ('00000000-0000-0000-0000-000000000007', 'Review: The Ministry for the Future by Kim Stanley Robinson', 'review', 'https://lrb.co.uk/robinson-ministry-future', 'Robinson''s latest is less a novel than a policy document disguised as fiction—and that''s its power...', '2023-11-05', 'published'),
  ('00000000-0000-0000-0000-000000000008', 'Rasa Theory in the Novels of Amitav Ghosh', 'criticism', 'https://indianculturalforum.in/ghosh-rasa-theory', 'Ghosh''s Ibis Trilogy operates through a sophisticated deployment of classical aesthetic categories...', '2024-01-30', 'published')
) as v(creator_id, title, publication_type, source_url, excerpt, published_at, status)
on conflict do nothing;