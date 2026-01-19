import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  SkipForward, 
  Divide, 
  X, 
  Trophy,
  Clock,
  AlertCircle,
  Flame,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { QuizQuestion, Lifeline } from '@/hooks/useQuizGame';
import StreakBonus, { StreakPopup } from './StreakBonus';
import confetti from 'canvas-confetti';

interface QuizGameProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  lifelinesUsed: Lifeline[];
  hiddenOptions: number[];
  showHint: boolean;
  onAnswer: (answerIndex: number) => void;
  onUseLifeline: (lifeline: Lifeline) => boolean;
  onQuit: () => void;
  streak?: number;
}

const TIMER_DURATION = 30; // seconds

export default function QuizGame({
  question,
  questionNumber,
  totalQuestions,
  score,
  lifelinesUsed,
  hiddenOptions,
  showHint,
  onAnswer,
  onUseLifeline,
  onQuit,
  streak = 0,
}: QuizGameProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Timer
  useEffect(() => {
    if (showResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questionNumber, showResult]);

  // Reset state on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(TIMER_DURATION);
    setShowStreakPopup(false);
    setPointsEarned(0);
  }, [questionNumber]);

  const handleTimeUp = () => {
    setShowResult(true);
    setIsCorrect(false);
    setTimeout(() => onAnswer(-1), 1500);
  };

  const handleSelectAnswer = useCallback((index: number) => {
    if (showResult || hiddenOptions.includes(index)) return;
    
    setSelectedAnswer(index);
    const correct = index === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      // Calculate bonus points based on time and streak
      const timeBonus = Math.floor(timeLeft * 2);
      const streakMultiplier = Math.floor(streak / 3) + 1;
      const earned = (question.points + timeBonus) * streakMultiplier;
      setPointsEarned(earned);

      // Show streak popup for milestones
      if ((streak + 1) >= 3 && (streak + 1) % 2 === 1) {
        setShowStreakPopup(true);
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#d946ef', '#f97316', '#22c55e']
      });
    }

    setTimeout(() => onAnswer(index), 2000);
  }, [showResult, hiddenOptions, question.correct_answer, question.points, onAnswer, timeLeft, streak]);

  const optionLabels = ['A', 'B', 'C', 'D'];
  const timerPercent = (timeLeft / TIMER_DURATION) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/10"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -100],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="container max-w-4xl mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onQuit}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-1" />
              Quit
            </Button>
            
            {/* Score with animation */}
            <motion.div 
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
              animate={showResult && isCorrect ? { scale: [1, 1.1, 1] } : {}}
            >
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-xl">{score.toLocaleString()}</span>
              {pointsEarned > 0 && showResult && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-sm"
                >
                  +{pointsEarned}
                </motion.span>
              )}
            </motion.div>

            {/* Streak indicator */}
            {streak >= 2 && (
              <StreakBonus 
                streak={streak} 
                multiplier={Math.floor(streak / 3) + 1}
                showAnimation={showResult && isCorrect}
              />
            )}
          </div>
          
          {/* Timer */}
          <motion.div 
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm',
              timeLeft <= 10 ? 'bg-red-500/30' : 'bg-white/10'
            )}
            animate={timeLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
          >
            <Clock className={cn('h-5 w-5', timeLeft <= 10 && 'text-red-400')} />
            <span className={cn('font-mono font-bold text-lg', timeLeft <= 10 && 'text-red-400')}>
              {timeLeft}s
            </span>
          </motion.div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-white/60">Question {questionNumber}/{totalQuestions}</span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container max-w-3xl mx-auto px-4 py-8 relative z-10">
        <motion.div
          key={questionNumber}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                {question.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {question.points} pts
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
              {question.question}
            </h2>
            
            {/* Hint */}
            <AnimatePresence>
              {showHint && question.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30"
                >
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Lightbulb className="h-5 w-5" />
                    <span className="text-sm font-medium">{question.hint}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {question.options.map((option, index) => {
            const isHidden = hiddenOptions.includes(index);
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correct_answer;
            
            let optionClass = 'bg-white/10 hover:bg-white/20 border-white/20';
            if (showResult) {
              if (isCorrectAnswer) {
                optionClass = 'bg-green-500/30 border-green-400 ring-2 ring-green-400 shadow-lg shadow-green-500/20';
              } else if (isSelected && !isCorrect) {
                optionClass = 'bg-red-500/30 border-red-400 ring-2 ring-red-400 shadow-lg shadow-red-500/20';
              }
            } else if (isSelected) {
              optionClass = 'bg-primary/30 border-primary ring-2 ring-primary';
            }

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: isHidden ? 0.3 : 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                disabled={showResult || isHidden}
                onClick={() => handleSelectAnswer(index)}
                className={cn(
                  'p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-[1.02] active:scale-[0.98]',
                  optionClass,
                  isHidden && 'cursor-not-allowed line-through opacity-30'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all',
                    showResult && isCorrectAnswer ? 'bg-green-500 shadow-lg' : 
                    showResult && isSelected && !isCorrect ? 'bg-red-500 shadow-lg' :
                    'bg-white/20'
                  )}>
                    {showResult && isCorrectAnswer ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : showResult && isSelected && !isCorrect ? (
                      <XCircle className="h-6 w-6" />
                    ) : (
                      optionLabels[index]
                    )}
                  </span>
                  <span className="flex-1 text-lg">{option}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation on wrong answer */}
        <AnimatePresence>
          {showResult && !isCorrect && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-blue-500/20 rounded-2xl border border-blue-500/30 mb-8"
            >
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium mb-2">
                    Correct Answer: {optionLabels[question.correct_answer]}
                  </p>
                  <p className="text-white/80">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lifelines */}
        <div className="flex justify-center gap-4">
          <LifelineButton
            icon={<Divide className="h-6 w-6" />}
            label="50:50"
            used={lifelinesUsed.includes('50-50')}
            onClick={() => onUseLifeline('50-50')}
            disabled={showResult}
            color="from-orange-500 to-red-600"
          />
          <LifelineButton
            icon={<SkipForward className="h-6 w-6" />}
            label="Skip"
            used={lifelinesUsed.includes('skip')}
            onClick={() => onUseLifeline('skip')}
            disabled={showResult}
            color="from-blue-500 to-cyan-600"
          />
          <LifelineButton
            icon={<Lightbulb className="h-6 w-6" />}
            label="Hint"
            used={lifelinesUsed.includes('hint')}
            onClick={() => onUseLifeline('hint')}
            disabled={showResult}
            color="from-yellow-500 to-amber-600"
          />
        </div>
      </div>

      {/* Timer bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-white/10">
        <motion.div 
          className={cn(
            'h-full transition-colors duration-300',
            timeLeft <= 10 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-primary to-purple-500'
          )}
          style={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Streak Popup */}
      <AnimatePresence>
        {showStreakPopup && (
          <StreakPopup streak={streak + 1} />
        )}
      </AnimatePresence>
    </div>
  );
}

function LifelineButton({ 
  icon, 
  label, 
  used, 
  onClick, 
  disabled,
  color = 'from-primary to-primary/60'
}: { 
  icon: React.ReactNode; 
  label: string; 
  used: boolean; 
  onClick: () => void; 
  disabled?: boolean;
  color?: string;
}) {
  return (
    <motion.button
      whileHover={!used && !disabled ? { scale: 1.1 } : {}}
      whileTap={!used && !disabled ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={used || disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
        used 
          ? 'bg-white/5 text-white/30 cursor-not-allowed' 
          : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
      )}
    >
      <div className={cn(
        'w-14 h-14 rounded-xl flex items-center justify-center shadow-lg',
        used ? 'bg-white/10' : `bg-gradient-to-br ${color}`
      )}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
