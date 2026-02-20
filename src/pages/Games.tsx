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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GameModeSelector, { DailyChallenges, type GameMode } from '@/components/games/GameModeSelector';
import AchievementShowcase from '@/components/games/AchievementShowcase';
import StreakBonus from '@/components/games/StreakBonus';
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  BookOpen, 
  ChevronRight, 
  Sparkles,
  Users,
  Medal,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const BookSelector = lazy(() => import('@/components/games/BookSelector'));
const QuizGame = lazy(() => import('@/components/games/QuizGame'));
const Leaderboard = lazy(() => import('@/components/games/Leaderboard'));
const GameResults = lazy(() => import('@/components/games/GameResults'));
const FriendChallenge = lazy(() => import('@/components/games/FriendChallenge'));

type GameView = 'home' | 'select-mode' | 'select-book' | 'playing' | 'results';

export default function Games() {
  const { user, loading: authLoading } = useAuth();
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
  const { allBadges, userBadges, checkAndAwardBadges, newBadge, dismissNewBadge } = useGameBadges();
  
  const [view, setView] = useState<GameView>('home');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [lastGameResult, setLastGameResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'play' | 'social' | 'achievements'>('play');
  const [quoteIndex, setQuoteIndex] = useState(0);

  const bookQuotes = React.useMemo(() => [
    { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  ], []);

  React.useEffect(() => {
    if (!user) {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % bookQuotes.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, bookQuotes]);

  const handleBookSelect = async (bookId: string) => {
    await startGame(bookId, selectedDifficulty);
    setView('playing');
  };

  const handleAnswer = async (answerIndex: number) => {
    const result = await answerQuestion(answerIndex);
    
    if (gameStatus === 'finished' || !result?.isCorrect) {
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="h-12 w-12 mx-auto animate-pulse text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-100/40 rounded-full blur-3xl" />

        {/* Floating book icons background */}
        {[BookOpen, Star, Trophy, Zap, Flame, Target].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute text-amber-300/20"
            style={{
              top: `${15 + (i * 14) % 70}%`,
              left: `${5 + (i * 18) % 85}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.7,
            }}
          >
            <Icon className="h-10 w-10 md:h-14 md:w-14" />
          </motion.div>
        ))}

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            
            {/* Left Side - Stats & Fun Facts */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:flex flex-col gap-4"
            >
              {[
                { icon: "🧠", title: "10,000+", desc: "Quiz Questions", bg: "bg-amber-50 border-amber-100" },
                { icon: "📚", title: "500+", desc: "Books Available", bg: "bg-orange-50 border-orange-100" },
                { icon: "🏆", title: "4 Modes", desc: "Classic · Speed · Survival · Challenge", bg: "bg-yellow-50 border-yellow-100" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className={`p-4 rounded-2xl border backdrop-blur-sm bg-white/80 ${stat.bg} shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{stat.icon}</span>
                    <div>
                      <p className="text-lg font-bold text-foreground">{stat.title}</p>
                      <p className="text-xs text-muted-foreground">{stat.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Rotating Quote */}
              <motion.div
                className="p-4 rounded-2xl bg-white/60 border border-amber-100 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-sm italic text-foreground/70 leading-relaxed">
                      "{bookQuotes[quoteIndex].text}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">— {bookQuotes[quoteIndex].author}</p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Center - Main Card */}
            <div className="flex flex-col items-center gap-6">
              {/* Mobile-only quote */}
              <motion.div
                className="lg:hidden max-w-md text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-lg italic text-foreground/70 font-medium">
                      "{bookQuotes[quoteIndex].text}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">— {bookQuotes[quoteIndex].author}</p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
              >
                <Card className="text-center bg-white/95 backdrop-blur-sm border-border shadow-xl rounded-2xl">
                  <CardContent className="pt-8 pb-6">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                      className="inline-block"
                    >
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mb-4">
                        <Gamepad2 className="h-10 w-10 text-white" />
                      </div>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Book Quiz Challenge</h2>
                    <p className="text-muted-foreground mb-6">Test your knowledge, earn points, and compete with friends!</p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <Trophy className="h-7 w-7 mx-auto text-amber-600 mb-1.5" />
                        <p className="text-xs text-muted-foreground font-medium">Leaderboards</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-orange-50 border border-orange-100">
                        <Medal className="h-7 w-7 mx-auto text-orange-600 mb-1.5" />
                        <p className="text-xs text-muted-foreground font-medium">Achievements</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                        <Users className="h-7 w-7 mx-auto text-yellow-700 mb-1.5" />
                        <p className="text-xs text-muted-foreground font-medium">Multiplayer</p>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                      onClick={() => window.location.href = '/signin'}
                    >
                      Sign In to Play
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* How it works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full max-w-md"
              >
                <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">How It Works</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: BookOpen, label: "Pick a Book", desc: "Choose from our library" },
                    { icon: Target, label: "Answer Questions", desc: "AI-generated quizzes" },
                    { icon: Trophy, label: "Earn Rewards", desc: "Points, badges & ranks" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 mx-auto rounded-full bg-white/80 border border-amber-200 flex items-center justify-center mb-2 shadow-sm">
                        <item.icon className="h-5 w-5 text-amber-600" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Side - Game Modes & Ranks */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:flex flex-col gap-4"
            >
              {/* Game Modes Preview */}
              <div className="p-4 rounded-2xl bg-white/80 border border-amber-100 backdrop-blur-sm shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Game Modes</p>
                {[
                  { emoji: "🎯", name: "Classic", desc: "Answer at your own pace" },
                  { emoji: "⚡", name: "Speed Run", desc: "Race against the clock" },
                  { emoji: "❤️", name: "Survival", desc: "3 lives, no mistakes" },
                  { emoji: "🏅", name: "Challenge", desc: "Compete with friends" },
                ].map((mode, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 py-2 border-b border-amber-50 last:border-0"
                  >
                    <span className="text-xl">{mode.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{mode.name}</p>
                      <p className="text-xs text-muted-foreground">{mode.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Ranks Preview */}
              <div className="p-4 rounded-2xl bg-white/80 border border-amber-100 backdrop-blur-sm shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Climb the Ranks</p>
                <div className="flex flex-wrap gap-2">
                  {["📖 Beginner", "📕 Reader", "📗 Scholar", "📘 Expert", "👑 Master"].map((rank, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="px-3 py-1.5 text-xs rounded-full bg-amber-50 border border-amber-200 text-foreground font-medium"
                    >
                      {rank}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Live Stats Teaser */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-100/50 to-orange-100/50 border border-amber-200 backdrop-blur-sm text-center"
              >
                <Sparkles className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                <p className="text-sm font-semibold text-foreground">Join the Community</p>
                <p className="text-xs text-muted-foreground mt-1">Compete, learn, and have fun with fellow readers!</p>
              </motion.div>
            </motion.div>

          </div>
        </div>
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
        <Suspense fallback={
          <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Gamepad2 className="h-12 w-12 mx-auto animate-pulse text-primary mb-4" />
              <p className="text-muted-foreground">Loading game...</p>
            </div>
          </div>
        }>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="container max-w-6xl mx-auto px-4 py-8"
              >
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-amber-500/20 p-8 mb-8">
                  <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center gap-3 mb-4"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                          <Gamepad2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Book Quiz
                          </h1>
                          <p className="text-sm text-muted-foreground">Test your knowledge!</p>
                        </div>
                      </motion.div>

                      {/* Current Streak */}
                      {stats?.current_streak && stats.current_streak >= 2 && (
                        <StreakBonus 
                          streak={stats.current_streak} 
                          multiplier={Math.floor(stats.current_streak / 3) + 1} 
                        />
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3">
                      <div className="text-center px-4 py-2 rounded-xl bg-background/50 backdrop-blur-sm">
                        <p className="text-2xl font-bold text-primary">{stats?.total_points?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Points</p>
                      </div>
                      <div className="text-center px-4 py-2 rounded-xl bg-background/50 backdrop-blur-sm">
                        <p className="text-2xl">{currentRank.icon}</p>
                        <p className="text-xs text-muted-foreground">{currentRank.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rank Progress */}
                  {nextRank && (
                    <div className="relative z-10 mt-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress to {nextRank.name}</span>
                        <span className="font-medium">{nextRank.minPoints - (stats?.total_points || 0)} pts to go</span>
                      </div>
                      <Progress value={progressToNextRank} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-8">
                  <TabsList className="grid w-full grid-cols-3 h-12">
                    <TabsTrigger value="play" className="gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Play</span>
                    </TabsTrigger>
                    <TabsTrigger value="social" className="gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Social</span>
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="gap-2">
                      <Trophy className="h-4 w-4" />
                      <span className="hidden sm:inline">Achievements</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="play" className="mt-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard 
                        icon={<Trophy className="h-5 w-5" />} 
                        label="Total Points" 
                        value={stats?.total_points || 0}
                        loading={statsLoading}
                        gradient="from-yellow-500/20 to-amber-500/20"
                        iconColor="text-yellow-500"
                      />
                      <StatCard 
                        icon={<Target className="h-5 w-5" />} 
                        label="Games Played" 
                        value={stats?.games_played || 0}
                        loading={statsLoading}
                        gradient="from-blue-500/20 to-cyan-500/20"
                        iconColor="text-blue-500"
                      />
                      <StatCard 
                        icon={<Star className="h-5 w-5" />} 
                        label="Games Won" 
                        value={stats?.games_won || 0}
                        loading={statsLoading}
                        gradient="from-amber-500/20 to-orange-500/20"
                        iconColor="text-amber-600"
                      />
                      <StatCard 
                        icon={<Flame className="h-5 w-5" />} 
                        label="Best Streak" 
                        value={stats?.best_streak || 0}
                        loading={statsLoading}
                        gradient="from-red-500/20 to-orange-500/20"
                        iconColor="text-red-500"
                      />
                    </div>

                    {/* Daily Challenges */}
                    <DailyChallenges onSelectChallenge={(id) => {
                      setSelectedMode('challenge');
                      setView('select-book');
                    }} />

                    {/* Play Button */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-xl font-bold mb-2">Ready to Play?</h3>
                            <p className="text-muted-foreground text-sm">Choose a difficulty and test your book knowledge!</p>
                            
                            {/* Difficulty Selector */}
                            <div className="flex justify-center sm:justify-start gap-2 mt-4">
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
                                  {diff}
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {diff === 'easy' ? '50' : diff === 'medium' ? '100' : '200'}
                                  </Badge>
                                </Button>
                              ))}
                            </div>
                          </div>

                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              size="lg" 
                              className="text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xl"
                              onClick={() => setView('select-book')}
                            >
                              <Sparkles className="mr-2 h-5 w-5" />
                              Start Quiz
                              <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Leaderboard */}
                    <Leaderboard />
                  </TabsContent>

                  <TabsContent value="social" className="mt-6">
                    <FriendChallenge 
                      onStartChallenge={(friendId, bookId) => {
                        // TODO: Implement friend challenge
                      }}
                      onAcceptChallenge={(challengeId) => {
                        // TODO: Implement accept challenge
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="achievements" className="mt-6">
                    <AchievementShowcase 
                      allBadges={allBadges}
                      userBadges={userBadges}
                      totalPoints={stats?.total_points || 0}
                      gamesPlayed={stats?.games_played || 0}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {view === 'select-mode' && (
              <motion.div
                key="select-mode"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="container max-w-4xl mx-auto px-4 py-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <Button variant="ghost" size="icon" onClick={() => setView('home')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold">Select Game Mode</h1>
                    <p className="text-muted-foreground">Choose how you want to play</p>
                  </div>
                </div>

                <GameModeSelector 
                  selectedMode={selectedMode}
                  onSelectMode={(mode) => {
                    setSelectedMode(mode);
                    setView('select-book');
                  }}
                />
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
                  streak={correctAnswers}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={dismissNewBadge}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-3xl p-8 text-center max-w-sm border border-yellow-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-7xl mb-4"
              >
                {newBadge.icon}
              </motion.div>
              <h3 className="text-2xl font-black mb-2">Achievement Unlocked!</h3>
              <p className="text-xl text-primary font-bold mb-2">{newBadge.name}</p>
              <p className="text-muted-foreground mb-6">{newBadge.description}</p>
              <Button onClick={dismissNewBadge} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                <Sparkles className="mr-2 h-4 w-4" />
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  gradient?: string;
  iconColor?: string;
}

function StatCard({ icon, label, value, loading, gradient, iconColor }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', gradient && `bg-gradient-to-br ${gradient}`)}>
      <CardContent className="pt-4 pb-3">
        <div className={cn('flex items-center gap-2 mb-1', iconColor || 'text-muted-foreground')}>
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <motion.p 
            key={value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold"
          >
            {value.toLocaleString()}
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
