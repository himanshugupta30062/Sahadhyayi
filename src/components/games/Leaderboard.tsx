import React from 'react';
import { motion } from 'framer-motion';
import { useLeaderboard } from '@/hooks/useGameStats';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Star, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { user } = useAuth();
  const { leaderboard, loading } = useLeaderboard(10);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-300" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{index + 1}</span>;
    }
  };

  const getRankStyles = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border-yellow-500/30 shadow-yellow-500/10';
      case 1:
        return 'bg-gradient-to-r from-gray-300/20 via-slate-300/10 to-transparent border-gray-300/30';
      case 2:
        return 'bg-gradient-to-r from-amber-600/20 via-orange-500/10 to-transparent border-amber-600/30';
      default:
        return 'bg-card hover:bg-accent/50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium mb-1">No players yet</p>
          <p className="text-muted-foreground">Be the first to play and claim the top spot!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Top 10
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = user?.id === entry.user_id;
          
          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border transition-all',
                getRankStyles(index),
                isCurrentUser && 'ring-2 ring-primary'
              )}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(index)}
              </div>

              {/* Avatar */}
              <div className="relative">
                <Avatar className={cn(
                  'h-12 w-12',
                  index === 0 && 'ring-2 ring-yellow-400',
                  index === 1 && 'ring-2 ring-gray-300',
                  index === 2 && 'ring-2 ring-amber-600'
                )}>
                  <AvatarImage src={entry.profile_photo_url || undefined} />
                  <AvatarFallback className={cn(
                    'text-lg font-bold',
                    index === 0 && 'bg-yellow-500/20 text-yellow-600',
                    index === 1 && 'bg-gray-300/20 text-gray-600',
                    index === 2 && 'bg-amber-500/20 text-amber-600'
                  )}>
                    {(entry.full_name || entry.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Streak badge for top 3 */}
                {index < 3 && entry.games_won > 5 && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Flame className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'font-semibold truncate',
                    index === 0 && 'text-yellow-600 dark:text-yellow-400'
                  )}>
                    {entry.full_name || entry.username || 'Anonymous'}
                  </p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {entry.rank}
                  </span>
                  <span>•</span>
                  <span>{entry.games_won} wins</span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className={cn(
                  'text-xl font-bold',
                  index === 0 && 'text-yellow-600 dark:text-yellow-400',
                  index === 1 && 'text-gray-500',
                  index === 2 && 'text-amber-600'
                )}>
                  {entry.total_points.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
