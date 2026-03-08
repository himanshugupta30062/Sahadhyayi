
-- Batch 1: Author events and posts (no FK issues)
INSERT INTO author_events (author_id, title, description, event_type, start_date, end_date, location, is_published, max_attendees) VALUES
('7fc9e58f-065a-43c7-8fb5-8ba43dcdd1a3', 'Book Launch: The Art of Living', 'Join us for the grand launch of the latest bestseller!', 'signing', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 3 hours', 'Delhi Book Fair, Pragati Maidan', true, 200),
('6b183668-3578-4bdb-af0b-29a9d35f685a', 'Live Reading Session', 'An intimate reading session followed by Q&A', 'reading', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 2 hours', 'Crossword Bookstore, Mumbai', true, 50),
('43d45a04-c73e-484c-8501-25e7df1497a2', 'Writing Masterclass', 'Learn the art of storytelling', 'workshop', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days 4 hours', 'Online via Zoom', true, 100);

INSERT INTO author_posts (author_id, title, content, post_type, is_published, allow_comments) VALUES
('7fc9e58f-065a-43c7-8fb5-8ba43dcdd1a3', 'My Writing Journey', 'It has been an incredible journey writing my latest book. Thank you for your constant support!', 'blog_post', true, true),
('6b183668-3578-4bdb-af0b-29a9d35f685a', 'Announcing New Book!', 'Thrilled to announce that my new novel releases next month. Stay tuned for the cover reveal!', 'announcement', true, true),
('43d45a04-c73e-484c-8501-25e7df1497a2', 'Reading Recommendations for March', 'Here are my top 5 book recommendations for this month.', 'status_update', true, true),
('e369331b-1ec1-42cf-88da-a9c1c56c42d0', 'Behind the Scenes', 'A sneak peek into my writing desk and the tools I use every day.', 'blog_post', true, true);
