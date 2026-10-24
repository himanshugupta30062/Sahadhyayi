import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';

export interface QuizQuestion {
  id?: string;
  book_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  points: number;
  hint?: string;
  explanation?: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  book_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  current_question: number;
  score: number;
  difficulty: string;
  lifelines_used: string[];
  started_at: string;
  completed_at?: string;
}

export type Lifeline = '50-50' | 'skip' | 'hint';
export type QuizMode = 'classic' | 'speed' | 'survival' | 'challenge';

export function useQuizGame() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [session, setSession] = useState<GameSession | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [lifelinesUsed, setLifelinesUsed] = useState<Lifeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [mode, setMode] = useState<QuizMode>('classic');
  const [lives, setLives] = useState(3);

  const startGame = useCallback(async (bookId: string, difficulty: string = 'medium', selectedMode: QuizMode = 'classic') => {
    if (!user) {
      toast.error('Please sign in to play');
      return false;
    }

    setLoading(true);
    try {
      // Generate questions
      const response = await supabase.functions.invoke('generate-quiz-questions', {
        body: { bookId, difficulty, count: selectedMode === 'speed' ? 15 : 10 },
      });

      if (response.error) throw response.error;

      const generatedQuestions = response.data?.questions || [];
      if (generatedQuestions.length === 0) {
        toast.error('Could not generate questions for this book');
        return false;
      }

      // Create game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          user_id: user.id,
          book_id: bookId,
          difficulty,
          status: 'in_progress',
          score: 0,
          current_question: 0,
          lifelines_used: [],
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setQuestions(generatedQuestions);
      setMode(selectedMode);
      setLives(3);
      setSession(sessionData as GameSession);
      setCurrentQuestionIndex(0);
      setScore(0);
      setCorrectAnswers(0);
      setLifelinesUsed([]);
      setHiddenOptions([]);
      setShowHint(false);
      setQuestionStartedAt(Date.now());
      setGameStatus('playing');
      toast.success('Game started! Good luck! 🎮');
      return true;
    } catch (err: any) {
      console.error('Error starting game:', err);
      toast.error('Failed to start game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const answerQuestion = useCallback(async (answerIndex: number) => {
    if (!session || gameStatus !== 'playing') return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correct_answer;
    const basePoints = isCorrect ? currentQuestion.points : 0;
    const pointsEarned = mode === 'speed' && isCorrect ? basePoints * 2 : basePoints;
    const timeTakenSeconds = questionStartedAt
      ? Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000))
      : null;

    // Record the answer
    await supabase.from('game_answers').insert({
      session_id: session.id,
      question_id: currentQuestion.id,
      user_answer: answerIndex,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      time_taken_seconds: timeTakenSeconds,
    });

    if (isCorrect) {
      setScore(prev => prev + pointsEarned);
      setCorrectAnswers(prev => prev + 1);
    }

    // Survival grants three lives; other modes continue after a wrong answer.
    const nextLives = mode === 'survival' && !isCorrect ? lives - 1 : lives;
    if (mode === 'survival' && !isCorrect) setLives(nextLives);
    const finished = currentQuestionIndex >= questions.length - 1 || (mode === 'survival' && nextLives <= 0);

    // Move to next question or end game
    if (finished) {
      // Game over
      await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          score: score + pointsEarned,
          current_question: currentQuestionIndex + 1,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      setGameStatus('finished');
      setQuestionStartedAt(null);
    } else {
      // Next question
      setCurrentQuestionIndex(prev => prev + 1);
      setHiddenOptions([]);
      setShowHint(false);
      setQuestionStartedAt(Date.now());

      await supabase
        .from('game_sessions')
        .update({
          score: score + pointsEarned,
          current_question: currentQuestionIndex + 1,
        })
        .eq('id', session.id);
    }

    return { isCorrect, pointsEarned, finished };
  }, [session, gameStatus, questions, currentQuestionIndex, score, questionStartedAt, mode, lives]);

  const useLifeline = useCallback((lifeline: Lifeline) => {
    if (lifelinesUsed.includes(lifeline)) {
      toast.error('You already used this lifeline!');
      return false;
    }

    const currentQuestion = questions[currentQuestionIndex];

    switch (lifeline) {
      case '50-50': {
        // Hide 2 wrong answers
        const wrongAnswers = currentQuestion.options
          .map((_, i) => i)
          .filter(i => i !== currentQuestion.correct_answer);
        const toHide = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
        setHiddenOptions(toHide);
        break;
      }
      case 'hint':
        setShowHint(true);
        break;
      case 'skip':
        // Move to next question without penalty
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setHiddenOptions([]);
          setShowHint(false);
          setQuestionStartedAt(Date.now());
        }
        break;
    }

    setLifelinesUsed(prev => [...prev, lifeline]);
    toast.success(`${lifeline} lifeline used!`);
    return true;
  }, [lifelinesUsed, questions, currentQuestionIndex]);

  const resetGame = useCallback(() => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSession(null);
    setScore(0);
    setCorrectAnswers(0);
    setLifelinesUsed([]);
    setHiddenOptions([]);
    setShowHint(false);
    setQuestionStartedAt(null);
    setMode('classic');
    setLives(3);
    setGameStatus('idle');
  }, []);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  return {
    // State
    questions,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    session,
    score,
    correctAnswers,
    lifelinesUsed,
    loading,
    gameStatus,
    hiddenOptions,
    showHint,
    isLastQuestion,
    mode,
    lives,
    // Actions
    startGame,
    answerQuestion,
    useLifeline,
    resetGame,
  };
}
