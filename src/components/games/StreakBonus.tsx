import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBonusProps {
  streak: number;
  multiplier: number;
  showAnimation?: boolean;
}

export default function StreakBonus({ streak, multiplier, showAnimation = false }: StreakBonusProps) {
  if (streak < 2) return null;

  const getStreakColor = () => {
    if (streak >= 10) return 'from-purple-500 to-pink-500 text-white';
    if (streak >= 7) return 'from-red-500 to-orange-500 text-white';
    if (streak >= 5) return 'from-orange-500 to-yellow-500 text-white';
    if (streak >= 3) return 'from-yellow-500 to-amber-500 text-white';
    return 'from-blue-500 to-cyan-500 text-white';
  };

  const getStreakLabel = () => {
    if (streak >= 10) return 'UNSTOPPABLE!';
    if (streak >= 7) return 'ON FIRE!';
    if (streak >= 5) return 'AMAZING!';
    if (streak >= 3) return 'NICE!';
    return 'STREAK';
  };

  return (
    <AnimatePresence>
      <motion.div
        key={streak}
        initial={{ scale: 0.5, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r shadow-lg',
          getStreakColor()
        )}
      >
        <motion.div
          animate={showAnimation ? { 
            rotate: [0, -15, 15, -15, 15, 0],
            scale: [1, 1.2, 1]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <Flame className="h-5 w-5" />
        </motion.div>
        
        <div className="flex items-center gap-1">
          <span className="font-black text-lg">{streak}</span>
          <span className="text-xs font-bold opacity-90">{getStreakLabel()}</span>
        </div>

        {multiplier > 1 && (
          <div className="flex items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
            <Zap className="h-3 w-3" />
            <span className="text-xs font-bold">{multiplier}x</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Streak popup animation
export function StreakPopup({ streak }: { streak: number }) {
  const messages = [
    { min: 3, text: 'Great!', emoji: '👍' },
    { min: 5, text: 'Awesome!', emoji: '🔥' },
    { min: 7, text: 'Incredible!', emoji: '⚡' },
    { min: 10, text: 'LEGENDARY!', emoji: '👑' },
  ];

  const message = [...messages].reverse().find(m => streak >= m.min);
  if (!message) return null;

  return (
    <motion.div
      initial={{ scale: 0, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0, y: -50, opacity: 0 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl shadow-2xl">
        <span className="text-3xl">{message.emoji}</span>
        <div>
          <p className="text-2xl font-black">{message.text}</p>
          <p className="text-sm opacity-80">{streak} in a row!</p>
        </div>
      </div>
    </motion.div>
  );
}
