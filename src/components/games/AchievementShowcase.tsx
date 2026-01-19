import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Flame, 
  Zap,
  Crown,
  Medal,
  Target,
  BookOpen,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge as BadgeType, UserBadge } from '@/hooks/useGameBadges';

interface AchievementShowcaseProps {
  allBadges: BadgeType[];
  userBadges: UserBadge[];
  totalPoints: number;
  gamesPlayed: number;
}

const badgeIcons: Record<string, React.ReactNode> = {
  '🎮': <Zap className="h-6 w-6" />,
  '🏆': <Trophy className="h-6 w-6" />,
  '⭐': <Star className="h-6 w-6" />,
  '🔥': <Flame className="h-6 w-6" />,
  '👑': <Crown className="h-6 w-6" />,
  '🥇': <Medal className="h-6 w-6" />,
  '🎯': <Target className="h-6 w-6" />,
  '📚': <BookOpen className="h-6 w-6" />,
  '⚡': <Clock className="h-6 w-6" />,
};

const rarityColors: Record<string, string> = {
  common: 'from-slate-400 to-slate-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-amber-600',
};

function getBadgeRarity(reqValue: number): string {
  if (reqValue >= 50000) return 'legendary';
  if (reqValue >= 5000) return 'epic';
  if (reqValue >= 500) return 'rare';
  return 'common';
}

export default function AchievementShowcase({ 
  allBadges, 
  userBadges,
  totalPoints,
  gamesPlayed 
}: AchievementShowcaseProps) {
  const earnedIds = new Set(userBadges.map(ub => ub.badge_id));
  
  // Sort badges: earned first, then by requirement value
  const sortedBadges = [...allBadges].sort((a, b) => {
    const aEarned = earnedIds.has(a.id);
    const bEarned = earnedIds.has(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return a.requirement_value - b.requirement_value;
  });

  const getProgress = (badge: BadgeType): number => {
    switch (badge.requirement_type) {
      case 'games_played':
        return Math.min(100, (gamesPlayed / badge.requirement_value) * 100);
      case 'total_points':
      case 'rank':
        return Math.min(100, (totalPoints / badge.requirement_value) * 100);
      default:
        return 0;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <Badge variant="secondary">
            {userBadges.length}/{allBadges.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {sortedBadges.map((badge, index) => {
            const isEarned = earnedIds.has(badge.id);
            const rarity = getBadgeRarity(badge.requirement_value);
            const progress = getProgress(badge);
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div
                  className={cn(
                    'aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative overflow-hidden',
                    isEarned 
                      ? `bg-gradient-to-br ${rarityColors[rarity]} shadow-lg` 
                      : 'bg-muted border-2 border-dashed border-muted-foreground/30'
                  )}
                >
                  {/* Shine effect for earned badges */}
                  {isEarned && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    'relative z-10',
                    isEarned ? 'text-white' : 'text-muted-foreground/50'
                  )}>
                    {badgeIcons[badge.icon] || <Trophy className="h-6 w-6" />}
                    {!isEarned && (
                      <Lock className="h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Name */}
                  <span className={cn(
                    'text-[10px] font-medium text-center mt-1 line-clamp-1',
                    isEarned ? 'text-white' : 'text-muted-foreground'
                  )}>
                    {badge.name}
                  </span>
                </div>

                {/* Progress bar for unearned */}
                {!isEarned && progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/20 rounded-b-2xl overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg whitespace-nowrap">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-muted-foreground">{badge.description}</p>
                    {!isEarned && (
                      <p className="text-primary mt-1">{Math.round(progress)}% complete</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
