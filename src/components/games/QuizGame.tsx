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
  AlertCircle
} from 'lucide-react';
import type { QuizQuestion, Lifeline } from '@/hooks/useQuizGame';
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
}: QuizGameProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);

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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setTimeout(() => onAnswer(index), 1500);
  }, [showResult, hiddenOptions, question.correct_answer, onAnswer]);

  const optionLabels = ['A', 'B', 'C', 'D'];
  const timerPercent = (timeLeft / TIMER_DURATION) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="container max-w-4xl mx-auto px-4 py-4">
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
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-xl">{score.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Timer */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            timeLeft <= 10 ? 'bg-red-500/30 animate-pulse' : 'bg-white/10'
          )}>
            <Clock className={cn('h-5 w-5', timeLeft <= 10 && 'text-red-400')} />
            <span className={cn('font-mono font-bold text-lg', timeLeft <= 10 && 'text-red-400')}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-white/60">Question {questionNumber}/{totalQuestions}</span>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2 flex-1 bg-white/20" />
        </div>
      </div>

      {/* Question */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <motion.div
          key={questionNumber}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
            <span className="text-sm text-primary/80 font-medium mb-3 block">
              {question.points} Points
            </span>
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
                  className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30"
                >
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm">{question.hint}</span>
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
                optionClass = 'bg-green-500/30 border-green-400 ring-2 ring-green-400';
              } else if (isSelected && !isCorrect) {
                optionClass = 'bg-red-500/30 border-red-400 ring-2 ring-red-400';
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
                  'p-4 rounded-xl border-2 text-left transition-all transform hover:scale-[1.02] active:scale-[0.98]',
                  optionClass,
                  isHidden && 'cursor-not-allowed line-through opacity-30'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg',
                    showResult && isCorrectAnswer ? 'bg-green-500' : 
                    showResult && isSelected && !isCorrect ? 'bg-red-500' :
                    'bg-white/20'
                  )}>
                    {optionLabels[index]}
                  </span>
                  <span className="flex-1">{option}</span>
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
              className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30 mb-8"
            >
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium mb-1">Correct Answer: {optionLabels[question.correct_answer]}</p>
                  <p className="text-sm text-white/80">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lifelines */}
        <div className="flex justify-center gap-4">
          <LifelineButton
            icon={<Divide className="h-5 w-5" />}
            label="50:50"
            used={lifelinesUsed.includes('50-50')}
            onClick={() => onUseLifeline('50-50')}
            disabled={showResult}
          />
          <LifelineButton
            icon={<SkipForward className="h-5 w-5" />}
            label="Skip"
            used={lifelinesUsed.includes('skip')}
            onClick={() => onUseLifeline('skip')}
            disabled={showResult}
          />
          <LifelineButton
            icon={<Lightbulb className="h-5 w-5" />}
            label="Hint"
            used={lifelinesUsed.includes('hint')}
            onClick={() => onUseLifeline('hint')}
            disabled={showResult}
          />
        </div>
      </div>

      {/* Timer bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-2">
        <div 
          className={cn(
            'h-full transition-all duration-1000',
            timeLeft <= 10 ? 'bg-red-500' : 'bg-primary'
          )}
          style={{ width: `${timerPercent}%` }}
        />
      </div>
    </div>
  );
}

function LifelineButton({ 
  icon, 
  label, 
  used, 
  onClick, 
  disabled 
}: { 
  icon: React.ReactNode; 
  label: string; 
  used: boolean; 
  onClick: () => void; 
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={used || disabled}
      className={cn(
        'flex flex-col items-center gap-1 p-4 rounded-xl transition-all',
        used 
          ? 'bg-white/5 text-white/30 cursor-not-allowed' 
          : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center',
        used ? 'bg-white/10' : 'bg-gradient-to-br from-primary to-primary/60'
      )}>
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
