import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, Target, RotateCcw, Home, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface GameResultsProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function GameResults({
  score,
  correctAnswers,
  totalQuestions,
  onPlayAgain,
  onGoHome,
}: GameResultsProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const isPerfect = correctAnswers === totalQuestions;
  const isGood = percentage >= 70;

  useEffect(() => {
    if (isPerfect) {
      // Celebration confetti
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else if (isGood) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isPerfect, isGood]);

  const getMessage = () => {
    if (isPerfect) return { title: 'PERFECT! 🎉', subtitle: 'You are a true book master!' };
    if (percentage >= 80) return { title: 'Excellent! 🌟', subtitle: 'Amazing knowledge!' };
    if (percentage >= 60) return { title: 'Good Job! 👍', subtitle: 'Well done!' };
    if (percentage >= 40) return { title: 'Nice Try! 📚', subtitle: 'Keep reading and learning!' };
    return { title: 'Keep Going! 💪', subtitle: 'Practice makes perfect!' };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="pt-8 pb-6 text-center">
            {/* Trophy Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="mb-6"
            >
              <div className={cn(
                'w-24 h-24 mx-auto rounded-full flex items-center justify-center',
                isPerfect ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                isGood ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
                'bg-gradient-to-br from-blue-400 to-indigo-600'
              )}>
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-2">{message.title}</h2>
              <p className="text-white/70 mb-6">{message.subtitle}</p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white/10 rounded-xl p-4">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-2xl font-bold">{score}</p>
                <p className="text-xs text-white/60">Points</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-400" />
                <p className="text-2xl font-bold">{correctAnswers}/{totalQuestions}</p>
                <p className="text-xs text-white/60">Correct</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Star className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <p className="text-2xl font-bold">{percentage}%</p>
                <p className="text-xs text-white/60">Accuracy</p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-primary to-primary/80"
                onClick={onPlayAgain}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Play Again
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={onGoHome}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Book Quiz Results',
                        text: `I scored ${score} points (${percentage}% accuracy) in the Book Quiz! 📚🎮`,
                        url: window.location.href,
                      });
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
