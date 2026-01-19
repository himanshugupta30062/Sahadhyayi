import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Target, 
  RotateCcw, 
  Home, 
  Share2, 
  Sparkles,
  Flame,
  Zap,
  Crown,
  ArrowUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface GameResultsProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  newRank?: string;
  previousRank?: string;
}

export default function GameResults({
  score,
  correctAnswers,
  totalQuestions,
  onPlayAgain,
  onGoHome,
  newRank,
  previousRank,
}: GameResultsProps) {
  const [showRankUp, setShowRankUp] = useState(false);
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const isPerfect = correctAnswers === totalQuestions;
  const isGood = percentage >= 70;
  const rankChanged = newRank && previousRank && newRank !== previousRank;

  useEffect(() => {
    if (isPerfect) {
      // Epic celebration confetti
      const duration = 4 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8b5cf6', '#d946ef', '#f97316', '#22c55e', '#eab308']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8b5cf6', '#d946ef', '#f97316', '#22c55e', '#eab308']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else if (isGood) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#d946ef', '#22c55e']
      });
    }

    // Show rank up animation after a delay
    if (rankChanged) {
      setTimeout(() => setShowRankUp(true), 1500);
    }
  }, [isPerfect, isGood, rankChanged]);

  const getMessage = () => {
    if (isPerfect) return { title: 'PERFECT SCORE! 🎉', subtitle: 'You are a true book master!', emoji: '👑' };
    if (percentage >= 80) return { title: 'Excellent! 🌟', subtitle: 'Amazing knowledge!', emoji: '🏆' };
    if (percentage >= 60) return { title: 'Good Job! 👍', subtitle: 'Well done!', emoji: '⭐' };
    if (percentage >= 40) return { title: 'Nice Try! 📚', subtitle: 'Keep reading and learning!', emoji: '📖' };
    return { title: 'Keep Going! 💪', subtitle: 'Practice makes perfect!', emoji: '🔥' };
  };

  const message = getMessage();

  const handleShare = async () => {
    const shareText = `I scored ${score} points (${percentage}% accuracy) in the Book Quiz! 📚🎮 Can you beat me?`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Book Quiz Results',
          text: shareText,
          url: window.location.origin + '/games',
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText + ' ' + window.location.origin + '/games');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 100 + 20,
              height: Math.random() * 100 + 20,
              background: `radial-gradient(circle, ${
                ['rgba(139, 92, 246, 0.1)', 'rgba(217, 70, 239, 0.1)', 'rgba(34, 197, 94, 0.1)'][i % 3]
              } 0%, transparent 70%)`,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -200],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
          {/* Glow effect at top */}
          <div className={cn(
            'absolute top-0 left-0 right-0 h-32 opacity-30',
            isPerfect ? 'bg-gradient-to-b from-yellow-400 to-transparent' :
            isGood ? 'bg-gradient-to-b from-green-400 to-transparent' :
            'bg-gradient-to-b from-purple-400 to-transparent'
          )} />

          <CardContent className="pt-10 pb-8 text-center relative">
            {/* Trophy Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="mb-8"
            >
              <div className={cn(
                'w-28 h-28 mx-auto rounded-full flex items-center justify-center shadow-2xl relative',
                isPerfect ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                isGood ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
                'bg-gradient-to-br from-purple-400 to-indigo-600'
              )}>
                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: isPerfect ? 'rgba(234, 179, 8, 0.3)' :
                               isGood ? 'rgba(34, 197, 94, 0.3)' : 
                               'rgba(139, 92, 246, 0.3)',
                  }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {isPerfect ? (
                  <Crown className="h-14 w-14 text-white" />
                ) : (
                  <Trophy className="h-14 w-14 text-white" />
                )}
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-5xl mb-3">{message.emoji}</div>
              <h2 className="text-3xl font-black mb-2">{message.title}</h2>
              <p className="text-white/70 mb-8">{message.subtitle}</p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-2xl font-black">{score.toLocaleString()}</p>
                <p className="text-xs text-white/60">Points</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-2xl font-black">{correctAnswers}/{totalQuestions}</p>
                <p className="text-xs text-white/60">Correct</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-2xl font-black">{percentage}%</p>
                <p className="text-xs text-white/60">Accuracy</p>
              </div>
            </motion.div>

            {/* Bonus info */}
            {isPerfect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-4 py-1.5">
                  <Flame className="h-4 w-4 mr-1" />
                  Perfect Game Bonus!
                </Badge>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl h-14 text-lg"
                onClick={onPlayAgain}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Play Again
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 h-12"
                  onClick={onGoHome}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 h-12"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Rank Up Modal */}
        <AnimatePresence>
          {showRankUp && rankChanged && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute -bottom-4 left-0 right-0 flex justify-center"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                <ArrowUp className="h-5 w-5" />
                <span className="font-bold">Rank Up!</span>
                <span className="text-white/80">{previousRank}</span>
                <ArrowUp className="h-4 w-4" />
                <span className="font-black">{newRank}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
