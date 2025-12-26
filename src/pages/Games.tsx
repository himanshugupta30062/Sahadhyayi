import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useGameStats, getRankForPoints, getNextRank } from '@/hooks/useGameStats';
import { useQuizGame } from '@/hooks/useQuizGame';
import { useGameBadges } from '@/hooks/useGameBadges';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Gamepad2, Trophy, Star, Flame, Target, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const BookSelector = lazy(() => import('@/components/games/BookSelector'));
const QuizGame = lazy(() => import('@/components/games/QuizGame'));
const Leaderboard = lazy(() => import('@/components/games/Leaderboard'));
const GameResults = lazy(() => import('@/components/games/GameResults'));

type GameView = 'home' | 'select-book' | 'playing' | 'results';

export default function Games() {
  const { user } = useAuth();
  const { stats, loading: statsLoading, addPoints, refetch: refetchStats } = useGameStats();
  const { 
    currentQuestion, 
    currentQuestionIndex, 
    totalQuestions,
    score, 
    correctAnswers,
    lifelinesUsed,
    loading: gameLoading,
    gameStatus,
    hiddenOptions,
    showHint,
    startGame,
    answerQuestion,
    useLifeline,
    resetGame,
  } = useQuizGame();
  const { userBadges, checkAndAwardBadges, newBadge, dismissNewBadge } = useGameBadges();
  
  const [view, setView] = useState<GameView>('home');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [lastGameResult, setLastGameResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  const handleBookSelect = async (bookId: string) => {
    await startGame(bookId, selectedDifficulty);
    setView('playing');
  };

  const handleAnswer = async (answerIndex: number) => {
    const result = await answerQuestion(answerIndex);
    
    if (gameStatus === 'finished' || !result?.isCorrect) {
      // Game ended
      setLastGameResult({ score, correct: correctAnswers + (result?.isCorrect ? 1 : 0), total: totalQuestions });
      const isPerfect = correctAnswers + (result?.isCorrect ? 1 : 0) === totalQuestions;
      await addPoints(score + (result?.pointsEarned || 0), isPerfect);
      await checkAndAwardBadges({
        games_played: (stats?.games_played || 0) + 1,
        games_won: isPerfect ? (stats?.games_won || 0) + 1 : (stats?.games_won || 0),
        total_points: (stats?.total_points || 0) + score + (result?.pointsEarned || 0),
        current_streak: isPerfect ? (stats?.current_streak || 0) + 1 : 0,
        perfect_game: isPerfect,
      });
      refetchStats();
      setView('results');
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    setView('select-book');
  };

  const handleGoHome = () => {
    resetGame();
    setView('home');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <Gamepad2 className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In to Play</h2>
            <p className="text-muted-foreground mb-6">Join the Book Quiz challenge and test your knowledge!</p>
            <Button size="lg" onClick={() => window.location.href = '/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRank = stats ? getRankForPoints(stats.total_points) : { name: 'Beginner', icon: '📖' };
  const nextRank = stats ? getNextRank(stats.total_points) : null;
  const progressToNextRank = nextRank && stats 
    ? Math.min(100, (stats.total_points / nextRank.minPoints) * 100)
    : 100;

  return (
    <>
      <SEO 
        title="Book Quiz Game - Test Your Knowledge | Sahadhyayi"
        description="Challenge yourself with our KBC-style book quiz. Answer questions, earn points, and climb the leaderboard!"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
        <Suspense fallback={<div className="p-8"><Skeleton className="h-96 w-full" /></div>}>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="container max-w-6xl mx-auto px-4 py-8"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center gap-3 mb-4"
                  >
                    <Gamepad2 className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Book Quiz
                    </h1>
                  </motion.div>
                  <p className="text-lg text-muted-foreground">Test your knowledge and earn points!</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard 
                    icon={<Trophy className="h-6 w-6" />} 
                    label="Total Points" 
                    value={stats?.total_points || 0}
                    loading={statsLoading}
                  />
                  <StatCard 
                    icon={<Target className="h-6 w-6" />} 
                    label="Games Played" 
                    value={stats?.games_played || 0}
                    loading={statsLoading}
                  />
                  <StatCard 
                    icon={<Star className="h-6 w-6" />} 
                    label="Games Won" 
                    value={stats?.games_won || 0}
                    loading={statsLoading}
                  />
                  <StatCard 
                    icon={<Flame className="h-6 w-6" />} 
                    label="Best Streak" 
                    value={stats?.best_streak || 0}
                    loading={statsLoading}
                  />
                </div>

                {/* Rank Progress */}
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{currentRank.icon}</span>
                        <div>
                          <p className="font-semibold">{currentRank.name}</p>
                          <p className="text-sm text-muted-foreground">Current Rank</p>
                        </div>
                      </div>
                      {nextRank && (
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="font-semibold">{nextRank.name}</p>
                            <p className="text-sm text-muted-foreground">{nextRank.minPoints - (stats?.total_points || 0)} pts to go</p>
                          </div>
                          <span className="text-3xl">{nextRank.icon}</span>
                        </div>
                      )}
                    </div>
                    <Progress value={progressToNextRank} className="h-3" />
                  </CardContent>
                </Card>

                {/* Play Button */}
                <div className="text-center mb-12">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg" 
                      className="text-xl px-12 py-8 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl"
                      onClick={() => setView('select-book')}
                    >
                      <Sparkles className="mr-3 h-6 w-6" />
                      Start Quiz
                      <ChevronRight className="ml-3 h-6 w-6" />
                    </Button>
                  </motion.div>
                  
                  {/* Difficulty Selector */}
                  <div className="flex justify-center gap-2 mt-6">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <Button
                        key={diff}
                        variant={selectedDifficulty === diff ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDifficulty(diff)}
                        className={cn(
                          'capitalize',
                          selectedDifficulty === diff && diff === 'easy' && 'bg-green-600 hover:bg-green-700',
                          selectedDifficulty === diff && diff === 'medium' && 'bg-yellow-600 hover:bg-yellow-700',
                          selectedDifficulty === diff && diff === 'hard' && 'bg-red-600 hover:bg-red-700',
                        )}
                      >
                        {diff} ({diff === 'easy' ? '50' : diff === 'medium' ? '100' : '200'} pts)
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                {userBadges.length > 0 && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Your Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4">
                        {userBadges.map((ub) => (
                          <div key={ub.id} className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
                            <span className="text-2xl">{(ub as any).badge?.icon}</span>
                            <span className="font-medium">{(ub as any).badge?.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Leaderboard */}
                <Leaderboard />
              </motion.div>
            )}

            {view === 'select-book' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <BookSelector 
                  onSelect={handleBookSelect} 
                  onBack={() => setView('home')}
                  loading={gameLoading}
                />
              </motion.div>
            )}

            {view === 'playing' && currentQuestion && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <QuizGame
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={totalQuestions}
                  score={score}
                  lifelinesUsed={lifelinesUsed}
                  hiddenOptions={hiddenOptions}
                  showHint={showHint}
                  onAnswer={handleAnswer}
                  onUseLifeline={useLifeline}
                  onQuit={() => {
                    resetGame();
                    setView('home');
                  }}
                />
              </motion.div>
            )}

            {view === 'results' && lastGameResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GameResults
                  score={lastGameResult.score}
                  correctAnswers={lastGameResult.correct}
                  totalQuestions={lastGameResult.total}
                  onPlayAgain={handlePlayAgain}
                  onGoHome={handleGoHome}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </div>

      {/* New Badge Modal */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={dismissNewBadge}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              className="bg-card rounded-2xl p-8 text-center max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-6xl mb-4"
              >
                {newBadge.icon}
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Achievement Unlocked!</h3>
              <p className="text-xl text-primary font-semibold mb-2">{newBadge.name}</p>
              <p className="text-muted-foreground mb-6">{newBadge.description}</p>
              <Button onClick={dismissNewBadge} className="w-full">
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
