import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Lock, Sparkles, Target } from 'lucide-react';
import {
  evaluateReadingAchievements,
  AchievementEvaluationInput,
  AchievementCategory,
} from '@/lib/readingAchievements';

interface ProgressiveAchievementsProps {
  stats: AchievementEvaluationInput;
}

const CATEGORY_LABELS: Record<AchievementCategory | 'all', string> = {
  all: 'All Badges',
  books: 'Books',
  pages: 'Pages',
  streak: 'Streaks',
  genre: 'Genres',
  reviews: 'Reviews',
};

export const ProgressiveAchievements: React.FC<ProgressiveAchievementsProps> = ({
  stats,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const summary = evaluateReadingAchievements(stats);

  const displayedAchievements =
    selectedCategory === 'all'
      ? summary.achievements
      : summary.achievements.filter((a) => a.category === selectedCategory);

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              Reading Achievements
              <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                {summary.unlockedCount} of {summary.totalCount} Unlocked ({summary.percentUnlocked}%)
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Milestones earned automatically through your verified reading logs, streaks, and bookshelf activity.
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-1">
          {(Object.keys(CATEGORY_LABELS) as Array<AchievementCategory | 'all'>).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-7 text-xs px-2.5"
            >
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
        {/* Next Milestone Banner */}
        {summary.nextMilestone && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-card border border-border text-2xl shadow-2xs">
                {summary.nextMilestone.emoji}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">Next Milestone in Sight:</span>
                  <span className="text-xs font-semibold text-primary">{summary.nextMilestone.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {summary.nextMilestone.description} ({summary.nextMilestone.currentValue} of {summary.nextMilestone.targetValue})
                </p>
              </div>
            </div>

            <div className="w-full sm:w-48 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-foreground">
                <span>Progress</span>
                <span>{summary.nextMilestone.progressPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${summary.nextMilestone.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Grid of Achievements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedAchievements.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-colors ${
                badge.unlocked
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-border/80 bg-muted/15 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" role="img" aria-label={badge.name}>
                      {badge.unlocked ? badge.emoji : '🔒'}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                        {badge.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {badge.category}
                      </span>
                    </div>
                  </div>

                  {badge.unlocked ? (
                    <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border-amber-500/30">
                      Earned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Progress for locked badge */}
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {badge.unlocked
                      ? `Achieved (${badge.currentValue})`
                      : `${badge.currentValue} / ${badge.targetValue}`}
                  </span>
                  <span className="font-semibold text-foreground">
                    {badge.progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      badge.unlocked ? 'bg-amber-500' : 'bg-muted-foreground/40'
                    }`}
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressiveAchievements;
