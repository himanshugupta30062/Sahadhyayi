import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  calculateAnnualGoalStatus,
  calculateMonthlyGoalStatus,
  calculateWeeklyTimeGoalStatus,
} from '@/lib/readingGoalsEngine';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/components/ui/use-toast';

interface PersonalReadingGoalsCardProps {
  completedThisYear: number;
  initialAnnualGoal: number;
  initialMonthlyPagesTarget: number;
  monthPages: number;
  weekMinutes: number;
  onGoalUpdated?: (newAnnualGoal: number, newMonthlyPages: number) => void;
}

export const PersonalReadingGoalsCard: React.FC<PersonalReadingGoalsCardProps> = ({
  completedThisYear,
  initialAnnualGoal,
  initialMonthlyPagesTarget,
  monthPages,
  weekMinutes,
  onGoalUpdated,
}) => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [annualTarget, setAnnualTarget] = useState<number>(initialAnnualGoal || 12);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(initialMonthlyPagesTarget || 250);
  const [weeklyMinutesTarget, setWeeklyMinutesTarget] = useState<number>(120);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const annualStatus = calculateAnnualGoalStatus(completedThisYear, annualTarget);
  const monthlyStatus = calculateMonthlyGoalStatus(monthPages, monthlyTarget);
  const weeklyStatus = calculateWeeklyTimeGoalStatus(weekMinutes, weeklyMinutesTarget);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from('reading_goals').upsert(
        {
          user_id: user.id,
          annual_book_target: annualTarget,
          monthly_page_target: monthlyTarget,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      // Broadcast goal update for cross-component sync
      window.dispatchEvent(
        new CustomEvent('readingGoalUpdated', { detail: { goal: annualTarget } })
      );

      onGoalUpdated?.(annualTarget, monthlyTarget);
      setIsEditing(false);
      toast({ title: 'Goals Updated', description: 'Your reading goals and pace targets have been saved.' });
    } catch (err: any) {
      toast({
        title: 'Error Saving Goals',
        description: err.message || 'Could not save reading goals.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (annualStatus.status === 'completed') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          Goal Achieved!
        </Badge>
      );
    }
    if (annualStatus.status === 'ahead') {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          Ahead of Schedule
        </Badge>
      );
    }
    if (annualStatus.status === 'behind') {
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 gap-1 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          Pace Up Needed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        On Track
      </Badge>
    );
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              Reading Goals · {currentYear}
              {getStatusBadge()}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal targets for books, monthly volume, and weekly habit consistency.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs h-8 border-border"
        >
          {isEditing ? 'Cancel' : 'Edit Goals'}
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
        {/* Celebration Banner when completed */}
        {annualStatus.status === 'completed' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-primary/10 to-transparent border border-emerald-500/30 flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-500 text-white shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                🎉 Congratulations! You reached your {currentYear} reading goal!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You completed {completedThisYear} of {annualTarget} books. Consider raising your target to keep expanding your horizons!
              </p>
            </div>
          </div>
        )}

        {/* 3 Goal Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* 1. Annual Book Goal */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Annual Books
              </span>
              <span className="font-semibold text-foreground">
                {completedThisYear} / {annualTarget}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${annualStatus.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{annualStatus.percent}% completed</span>
              <span>{annualStatus.remaining} to go</span>
            </div>
            {annualStatus.remaining > 0 && (
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                Pace required: ~{annualStatus.requiredBooksPerMonth} books/mo (~{annualStatus.requiredPagesPerDayApprox} pgs/day)
              </p>
            )}
          </div>

          {/* 2. Monthly Page Goal */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Monthly Pages
              </span>
              <span className="font-semibold text-foreground">
                {monthPages} / {monthlyTarget}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${monthlyStatus.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{monthlyStatus.percent}% completed</span>
              <span>{monthlyStatus.remainingPages} pgs to go</span>
            </div>
            {monthlyStatus.remainingPages > 0 && (
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                Target pace: ~{monthlyStatus.requiredPagesPerDay} pages / day this month
              </p>
            )}
          </div>

          {/* 3. Weekly Habit Minutes */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Weekly Minutes
              </span>
              <span className="font-semibold text-foreground">
                {weekMinutes} / {weeklyMinutesTarget}m
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${weeklyStatus.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{weeklyStatus.percent}% completed</span>
              <span>{weeklyStatus.remainingMinutes}m to go</span>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              Weekly focus target across all daily sessions
            </p>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4"
          >
            <p className="text-xs font-semibold text-foreground">Adjust Your Personal Targets</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="target-annual-books" className="text-xs text-foreground">
                  Annual Books Target
                </Label>
                <Input
                  id="target-annual-books"
                  type="number"
                  min={1}
                  max={500}
                  value={annualTarget}
                  onChange={(e) => setAnnualTarget(parseInt(e.target.value, 10) || 1)}
                  className="h-8 text-xs bg-card"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="target-monthly-pages" className="text-xs text-foreground">
                  Monthly Pages Target
                </Label>
                <Input
                  id="target-monthly-pages"
                  type="number"
                  min={10}
                  max={50000}
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(parseInt(e.target.value, 10) || 10)}
                  className="h-8 text-xs bg-card"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="target-weekly-minutes" className="text-xs text-foreground">
                  Weekly Reading Minutes
                </Label>
                <Input
                  id="target-weekly-minutes"
                  type="number"
                  min={15}
                  max={3000}
                  value={weeklyMinutesTarget}
                  onChange={(e) => setWeeklyMinutesTarget(parseInt(e.target.value, 10) || 15)}
                  className="h-8 text-xs bg-card"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-xs h-7"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="text-xs h-7 bg-primary text-primary-foreground shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Targets'
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalReadingGoalsCard;
