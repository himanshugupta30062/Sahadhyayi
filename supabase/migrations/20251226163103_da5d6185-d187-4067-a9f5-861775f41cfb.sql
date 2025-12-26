-- User game stats and points
CREATE TABLE user_game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  rank text DEFAULT 'Beginner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Book quiz questions
CREATE TABLE book_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books_library(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  difficulty text DEFAULT 'medium',
  points integer DEFAULT 100,
  hint text,
  explanation text,
  created_at timestamptz DEFAULT now()
);

-- Game sessions
CREATE TABLE game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid REFERENCES books_library(id) ON DELETE SET NULL,
  status text DEFAULT 'in_progress',
  current_question integer DEFAULT 0,
  score integer DEFAULT 0,
  difficulty text DEFAULT 'medium',
  lifelines_used jsonb DEFAULT '[]',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- User answers history
CREATE TABLE game_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES book_quiz_questions(id) ON DELETE SET NULL,
  user_answer integer,
  is_correct boolean,
  time_taken_seconds integer,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Badges/Achievements
CREATE TABLE game_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User earned badges
CREATE TABLE user_game_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid REFERENCES game_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on all tables
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_game_stats
CREATE POLICY "Users can view their own stats" ON user_game_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON user_game_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON user_game_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view leaderboard stats" ON user_game_stats FOR SELECT USING (true);

-- RLS Policies for book_quiz_questions
CREATE POLICY "Anyone can view questions" ON book_quiz_questions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage questions" ON book_quiz_questions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their own sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON game_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_answers
CREATE POLICY "Users can view their own answers" ON game_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM game_sessions WHERE game_sessions.id = game_answers.session_id AND game_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own answers" ON game_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM game_sessions WHERE game_sessions.id = game_answers.session_id AND game_sessions.user_id = auth.uid())
);

-- RLS Policies for game_badges
CREATE POLICY "Anyone can view badges" ON game_badges FOR SELECT USING (true);
CREATE POLICY "Only admins can manage badges" ON game_badges FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_game_badges
CREATE POLICY "Users can view their own badges" ON user_game_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can award badges" ON user_game_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view user badges" ON user_game_badges FOR SELECT USING (true);

-- Insert default badges
INSERT INTO game_badges (name, description, icon, requirement_type, requirement_value) VALUES
('First Quiz', 'Complete your first quiz', '🎯', 'games_played', 1),
('Book Worm', 'Complete 10 quizzes', '📚', 'games_played', 10),
('On Fire', 'Answer 10 questions correctly in a row', '🔥', 'streak', 10),
('Perfect Score', 'Get all questions right in a game', '🏆', 'perfect_game', 1),
('Quiz Master', 'Earn 10,000 total points', '👑', 'total_points', 10000),
('Speed Reader', 'Answer 5 questions in under 10 seconds each', '⚡', 'speed_answers', 5),
('Scholar', 'Reach Scholar rank', '🎓', 'rank', 2000),
('Legend', 'Reach Legend rank', '🌟', 'rank', 50000);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_game_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_user_game_stats_trigger
BEFORE UPDATE ON user_game_stats
FOR EACH ROW EXECUTE FUNCTION update_user_game_stats();

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION get_game_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_photo_url text,
  total_points integer,
  games_won integer,
  rank text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ugs.user_id,
    p.username,
    p.full_name,
    p.profile_photo_url,
    ugs.total_points,
    ugs.games_won,
    ugs.rank
  FROM user_game_stats ugs
  JOIN profiles p ON p.id = ugs.user_id
  ORDER BY ugs.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;