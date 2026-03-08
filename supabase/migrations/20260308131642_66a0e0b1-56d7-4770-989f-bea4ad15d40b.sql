
-- Batch 2 fixed: Books, summaries, notifications, reading progress, contact messages

INSERT INTO books (title, author, description, cover_url) VALUES
('The Alchemist', 'Paulo Coelho', 'A story about following your dreams and discovering your personal legend.', 'https://covers.openlibrary.org/b/id/11153085-L.jpg'),
('Sapiens', 'Yuval Noah Harari', 'A brief history of humankind from the Stone Age to the present.', 'https://covers.openlibrary.org/b/id/8409327-L.jpg'),
('Atomic Habits', 'James Clear', 'Tiny changes, remarkable results. A guide to building good habits.', 'https://covers.openlibrary.org/b/id/10958382-L.jpg'),
('Wings of Fire', 'A.P.J. Abdul Kalam', 'Autobiography of the beloved former President of India.', NULL),
('Ikigai', 'Hector Garcia', 'The Japanese secret to a long and happy life.', 'https://covers.openlibrary.org/b/id/8479576-L.jpg');

INSERT INTO book_summaries (book_id, content, summary_type, chapter_number, duration_minutes, page_start, page_end) VALUES
('a6539dc3-cc6c-4991-908c-c5b4d214bcbd', 'This book explores the fundamental principles of human existence and our quest for meaning.', 'full_book', NULL, 15, 1, 320),
('cdd4186a-138d-4ff1-83d0-6c6a290010f1', 'Chapter 1 introduces the protagonist and sets up the central conflict.', 'chapter', 1, 5, 1, 45),
('404f7465-634a-4e17-a664-3b8de9d58e51', 'A comprehensive overview of the key themes: identity, belonging, and transformation.', 'full_book', NULL, 12, 1, 280),
('66bb844b-0134-496f-a2dc-85d7e47cc322', 'The opening chapter establishes the historical context and introduces key figures.', 'chapter', 1, 8, 1, 60);

INSERT INTO notifications (user_id, type, title, message, read, author_id) VALUES
('bd143d2c-b6a3-46d5-9c0b-9050cc022e5d', 'author_update', 'New post from your favorite author', 'Check out the latest blog post about writing journeys!', false, '7fc9e58f-065a-43c7-8fb5-8ba43dcdd1a3'),
('bd143d2c-b6a3-46d5-9c0b-9050cc022e5d', 'event_announcement', 'Upcoming Book Launch', 'A new book launch event is happening next week!', false, '6b183668-3578-4bdb-af0b-29a9d35f685a'),
('1207cd4a-5e6c-48f5-938f-a59949a50fd8', 'author_update', 'New announcement', 'An author you follow has shared exciting news!', true, '43d45a04-c73e-484c-8501-25e7df1497a2'),
('410c9ec5-45f4-4f19-b7e7-3d290c950472', 'new_book', 'New book added!', 'A new book has been added to the library.', false, 'e369331b-1ec1-42cf-88da-a9c1c56c42d0'),
('7a6879c9-a63c-4aa1-82ea-b67f3cbc6f1c', 'event_announcement', 'Writing Masterclass Coming Up', 'Do not miss the online writing masterclass!', false, '43d45a04-c73e-484c-8501-25e7df1497a2');

INSERT INTO reading_progress (user_id, book_title, current_page, total_pages, cover_image_url) VALUES
('bd143d2c-b6a3-46d5-9c0b-9050cc022e5d', 'The Alchemist', 85, 197, 'https://covers.openlibrary.org/b/id/11153085-L.jpg'),
('1207cd4a-5e6c-48f5-938f-a59949a50fd8', 'Sapiens', 150, 443, 'https://covers.openlibrary.org/b/id/8409327-L.jpg'),
('410c9ec5-45f4-4f19-b7e7-3d290c950472', 'Atomic Habits', 200, 320, 'https://covers.openlibrary.org/b/id/10958382-L.jpg'),
('7a6879c9-a63c-4aa1-82ea-b67f3cbc6f1c', 'Wings of Fire', 120, 190, NULL);

INSERT INTO contact_messages (name, email, message) VALUES
('Rahul Sharma', 'rahul@example.com', 'Great platform! Would love to see more Hindi books added.'),
('Priya Patel', 'priya@example.com', 'Can you add a feature to track reading streaks?');
