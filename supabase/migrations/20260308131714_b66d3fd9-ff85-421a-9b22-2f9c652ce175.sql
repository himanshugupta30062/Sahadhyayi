
-- Batch 3: Audio summaries (reference books table) and quiz questions (reference books_library)

INSERT INTO book_audio_summaries (book_id, audio_url, duration_seconds, transcript) VALUES
('2dac3c86-1314-4b1c-8e50-dd9320148d84', 'https://example.com/audio/alchemist-summary.mp3', 900, 'Welcome to the audio summary of The Alchemist. Today we explore the key themes of destiny and personal legend...'),
('fa3bbee9-198d-4c4f-8997-1c57bc0a8b55', 'https://example.com/audio/sapiens-summary.mp3', 1200, 'In this audio summary of Sapiens, we cover the cognitive revolution and the agricultural revolution...'),
('7cf856ba-c7da-4d6f-8d86-39608d9cf061', 'https://example.com/audio/atomic-habits-summary.mp3', 600, 'This summary covers the four laws of behavior change from Atomic Habits...');

INSERT INTO book_quiz_questions (book_id, question, options, correct_answer, difficulty, explanation, hint, points) VALUES
('a6539dc3-cc6c-4991-908c-c5b4d214bcbd', 'What is the main theme of this book?', '["Love and loss", "Quest for meaning", "Political intrigue", "Adventure"]', 1, 'medium', 'The book primarily explores human existence and the quest for meaning.', 'Think about philosophy', 100),
('a6539dc3-cc6c-4991-908c-c5b4d214bcbd', 'Who is the protagonist?', '["A scientist", "A philosopher", "A common person", "A king"]', 2, 'easy', 'The story follows a philosopher through life.', 'Think about wisdom seekers', 100),
('cdd4186a-138d-4ff1-83d0-6c6a290010f1', 'What genre does this book belong to?', '["Romance", "Mystery", "Science Fiction", "Historical"]', 1, 'easy', 'The book is classified as a mystery novel.', 'Think about solving puzzles', 150),
('404f7465-634a-4e17-a664-3b8de9d58e51', 'What narrative structure does the author use?', '["Linear", "Non-linear", "Epistolary", "Stream of consciousness"]', 1, 'hard', 'The story uses a non-linear timeline.', 'Time jumps around', 200),
('66bb844b-0134-496f-a2dc-85d7e47cc322', 'In which era is the book set?', '["Modern day", "Medieval", "Ancient", "Victorian"]', 2, 'medium', 'The book is set in ancient times.', 'Think about the earliest civilizations', 150);
