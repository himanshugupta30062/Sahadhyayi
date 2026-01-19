import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Target, 
  Timer, 
  Swords,
  BookOpen,
  Flame,
  Crown,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameMode = 'classic' | 'speed' | 'survival' | 'challenge';

interface GameModeOption {
  id: GameMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  badge?: string;
}

const gameModes: GameModeOption[] = [
  {
    id: 'classic',
    name: 'Classic Quiz',
    description: 'Answer 10 questions at your own pace',
    icon: <BookOpen className="h-8 w-8" />,
    color: 'from-blue-500 to-indigo-600',
    features: ['10 Questions', '30s per question', 'All lifelines'],
  },
  {
    id: 'speed',
    name: 'Speed Run',
    description: 'Race against time for bonus points',
    icon: <Zap className="h-8 w-8" />,
    color: 'from-yellow-500 to-orange-600',
    features: ['15 Questions', '15s per question', '2x Points'],
    badge: 'Popular',
  },
  {
    id: 'survival',
    name: 'Survival Mode',
    description: 'One wrong answer ends the game',
    icon: <Target className="h-8 w-8" />,
    color: 'from-red-500 to-rose-600',
    features: ['Unlimited', 'No timer', '3 Lives'],
    badge: 'Hard',
  },
  {
    id: 'challenge',
    name: 'Challenge Mode',
    description: 'Complete daily challenges for rewards',
    icon: <Swords className="h-8 w-8" />,
    color: 'from-purple-500 to-violet-600',
    features: ['3 Challenges', 'Daily reset', 'Bonus XP'],
    badge: 'New',
  },
];

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

export default function GameModeSelector({ selectedMode, onSelectMode }: GameModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {gameModes.map((mode, index) => (
        <motion.div
          key={mode.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            className={cn(
              'cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative group',
              selectedMode === mode.id && 'ring-2 ring-primary shadow-lg'
            )}
            onClick={() => onSelectMode(mode.id)}
          >
            {/* Gradient overlay */}
            <div className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br',
              mode.color
            )} />
            
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg',
                  mode.color
                )}>
                  {mode.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{mode.name}</h3>
                    {mode.badge && (
                      <Badge variant="secondary" className={cn(
                        'text-xs',
                        mode.badge === 'New' && 'bg-purple-500/20 text-purple-400',
                        mode.badge === 'Popular' && 'bg-yellow-500/20 text-yellow-400',
                        mode.badge === 'Hard' && 'bg-red-500/20 text-red-400',
                      )}>
                        {mode.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{mode.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {mode.features.map((feature, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-muted px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedMode === mode.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Daily Challenges Component
export function DailyChallenges({ onSelectChallenge }: { onSelectChallenge: (id: string) => void }) {
  const challenges = [
    { id: '1', title: 'Speed Demon', description: 'Answer 5 questions in under 30 seconds', reward: 500, icon: <Timer className="h-5 w-5" />, progress: 60 },
    { id: '2', title: 'Perfect Run', description: 'Get 100% accuracy in a game', reward: 1000, icon: <Crown className="h-5 w-5" />, progress: 0 },
    { id: '3', title: 'Fire Streak', description: 'Win 3 games in a row', reward: 750, icon: <Flame className="h-5 w-5" />, progress: 33 },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5" />
            <h3 className="font-bold">Daily Challenges</h3>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            Resets in 12h
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
            onClick={() => onSelectChallenge(challenge.id)}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {challenge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{challenge.title}</p>
              <p className="text-xs text-muted-foreground truncate">{challenge.description}</p>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${challenge.progress}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-primary">+{challenge.reward}</span>
              <p className="text-xs text-muted-foreground">pts</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
