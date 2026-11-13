import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  BookMarked,
  Clock3,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useReadingLogs } from '@/hooks/useReadingLogs';
import { useReadingStreak } from '@/hooks/useReadingStreak';
import { useReadingGoal } from '@/hooks/useReadingGoal';
import { PersonalReadingGoalsCard } from '@/components/reading/PersonalReadingGoalsCard';
import { ProgressiveAchievements } from '@/components/reading/ProgressiveAchievements';
import { ReadingPassportCard } from '@/components/reading/ReadingPassportCard';
import { downloadReadingHistoryCsv } from '@/utils/exportReadingHistoryCsv';

const StatsPage = () => {
  const { user } = useAuth();
  const { data: shelf = [], isLoading } = useUserBookshelf();
  const { data: logs = [], isLoading: logsLoading } = useReadingLogs();
  const { data: streak } = useReadingStreak();
  const { goal, currentYear, setGoal } = useReadingGoal();

  const [monthlyTarget, setMonthlyTarget] = useState<number>(250);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    supabase
      .from('reading_goals')
      .select('monthly_page_target')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active && !error && data?.monthly_page_target) {
          setMonthlyTarget(data.monthly_page_target);
        }
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Calculations
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }, []);

  const weekLogs = logs.filter((log) => new Date(log.logged_at) >= weekStart);
  const weekMinutes = weekLogs.reduce((sum, log) => sum + (log.minutes_read || 0), 0);
  const weekPages = weekLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0);

  const totalLoggedPages = logs.reduce((s, log) => s + (log.pages_read || 0), 0);
  const totalLoggedMinutes = logs.reduce((s, log) => s + (log.minutes_read || 0), 0);
  const avgSessionMinutes = logs.length ? Math.round(totalLoggedMinutes / logs.length) : 0;
  const avgPagesPerSession = logs.length ? Math.round(totalLoggedPages / logs.length) : 0;
  const longestSession = logs.reduce((max, log) => Math.max(max, log.minutes_read || 0), 0);

  // 28 days calendar
  const calendarDays = useMemo(() => {
    const calendarEnd = new Date();
    calendarEnd.setHours(0, 0, 0, 0);
    const calendarStart = new Date(calendarEnd);
    calendarStart.setDate(calendarStart.getDate() - 27);

    return Array.from({ length: 28 }, (_, i) => {
      const day = new Date(calendarStart);
      day.setDate(day.getDate() + i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
        day.getDate()
      ).padStart(2, '0')}`;
      const dayLogs = logs.filter((log) => {
        const d = new Date(log.logged_at);
        return (
          d.getFullYear() === day.getFullYear() &&
          d.getMonth() === day.getMonth() &&
          d.getDate() === day.getDate()
        );
      });
      return {
        key,
        day,
        pages: dayLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0),
        minutes: dayLogs.reduce((sum, log) => sum + (log.minutes_read || 0), 0),
        sessions: dayLogs.length,
      };
    });
  }, [logs]);

  const activeCalendarDays = calendarDays.filter((day) => day.sessions > 0).length;
  const calendarTotalPages = calendarDays.reduce((sum, day) => sum + day.pages, 0);
  const calendarTotalMinutes = calendarDays.reduce((sum, day) => sum + day.minutes, 0);
  const mostActiveDay = calendarDays.reduce(
    (best, day) => (day.minutes > best.minutes ? day : best),
    calendarDays[0]
  );

  // 7-day challenge
  const challengeCutoff = useMemo(() => {
    const c = new Date();
    c.setHours(0, 0, 0, 0);
    c.setDate(c.getDate() - 6);
    return c;
  }, []);
  const challengeDays = new Set(
    logs
      .filter((log) => new Date(log.logged_at) >= challengeCutoff)
      .map((log) => new Date(log.logged_at).toDateString())
  ).size;
  const challengeProgress = Math.min(100, Math.round((challengeDays / 7) * 100));

  // Weekday and Month totals
  const weekdayTotals = logs.reduce((acc, log) => {
    const day = new Date(log.logged_at).toLocaleDateString(undefined, { weekday: 'long' });
    acc[day] = (acc[day] || 0) + (log.pages_read || 0);
    return acc;
  }, {} as Record<string, number>);
  const bestReadingDay = Object.entries(weekdayTotals).sort((a, b) => b[1] - a[1])[0];
  const pagesPerActiveDay = activeCalendarDays
    ? Math.round(calendarDays.reduce((sum, day) => sum + day.pages, 0) / activeCalendarDays)
    : 0;

  const monthTotals = logs.reduce((acc, log) => {
    const key = log.logged_at?.slice(0, 7) || '';
    acc[key] = (acc[key] || 0) + (log.pages_read || 0);
    return acc;
  }, {} as Record<string, number>);
  const bestMonth = Object.entries(monthTotals).sort((a, b) => b[1] - a[1])[0];

  const completed = shelf.filter((x) => x.status === 'completed');
  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const monthPages = logs
    .filter((log) => new Date(log.logged_at) >= monthStart)
    .reduce((sum, log) => sum + (log.pages_read || 0), 0);

  const completedThisYear = completed.filter(
    (item) => item.completed_at && new Date(item.completed_at).getFullYear() === currentYear
  ).length;

  const yearLogs = logs.filter((log) => new Date(log.logged_at).getFullYear() === currentYear);
  const yearPages = yearLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0);
  const yearMinutes = yearLogs.reduce((sum, log) => sum + (log.minutes_read || 0), 0);
  const yearActiveDays = new Set(yearLogs.map((log) => new Date(log.logged_at).toDateString())).size;

  const reading = shelf.filter((x) => x.status === 'reading');
  const want = shelf.filter((x) => x.status === 'want_to_read');
  const dnf = shelf.filter((x) => x.status === 'dnf');

  // Trend buckets
  const [trendRange, setTrendRange] = useState<'month' | 'year'>('month');
  const trendBuckets = useMemo(() => {
    return Array.from({ length: trendRange === 'month' ? 6 : 12 }, (_, i) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (trendRange === 'month' ? 5 - i : 11 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString(undefined, {
        month: 'short',
        ...(trendRange === 'year' ? { year: '2-digit' } : {}),
      });
      const sessions = logs.filter((log) => log.logged_at?.slice(0, 7) === key);
      const finished = completed.filter((book) => book.completed_at?.slice(0, 7) === key);
      return {
        key,
        label,
        pages: sessions.reduce((sum, l) => sum + (l.pages_read || 0), 0),
        minutes: sessions.reduce((sum, l) => sum + (l.minutes_read || 0), 0),
        books: finished.length,
      };
    });
  }, [logs, completed, trendRange]);

  const trendMax = Math.max(1, ...trendBuckets.map((x) => x.pages));
  const completionMax = Math.max(1, ...trendBuckets.map((x) => x.books));

  // Genres
  const genreCounts = completed.reduce<Record<string, number>>((acc, x) => {
    const g = x.books_library?.genre?.trim() || 'Uncategorized';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const genres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  const topGenre = genres[0]?.[0];
  const genreVariety = Object.keys(genreCounts).filter((g) => g !== 'Uncategorized').length;
  const readerType =
    completed.length >= 10
      ? 'Seasoned reader'
      : completed.length >= 3
      ? 'Growing reader'
      : 'Curious beginner';
  const tasteType =
    genreVariety >= 5 ? 'Genre explorer' : genreVariety >= 2 ? 'Varied taste' : 'Finding your niche';

  const rated = completed.filter((x) => typeof x.rating === 'number' && x.rating > 0);
  const avg = rated.length
    ? (rated.reduce((s, x) => s + (x.rating || 0), 0) / rated.length).toFixed(1)
    : '—';

  // Yearly recap copy
  const recapText = `My ${currentYear} reading recap 📚
Books completed: ${completedThisYear}
Pages logged: ${yearPages.toLocaleString()}
Reading time: ${Math.round((yearMinutes / 60) * 10) / 10} hours
Active reading days: ${yearActiveDays}
Top genre: ${topGenre || 'Still discovering'}
Average rating: ${avg}/5

Reading with Sahadhyayi https://sahadhyayi.com`;

  const [recapCopied, setRecapCopied] = useState(false);
  const copyRecap = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(recapText);
        setRecapCopied(true);
        setTimeout(() => setRecapCopied(false), 2500);
      }
    } catch {
      setRecapCopied(false);
    }
  };

  const counts = [
    { label: 'Books finished', value: completed.length, icon: BookMarked },
    { label: 'Currently reading', value: reading.length, icon: BookOpen },
    { label: 'Want to read', value: want.length, icon: Clock3 },
    { label: 'Did not finish', value: dnf.length, icon: TrendingUp },
  ];

  if (!user) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Your reading stats</h1>
        <p className="my-3 text-muted-foreground">Sign in to see your personal reading insights.</p>
        <Button asChild>
          <Link to="/signin">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="My Reading Stats | Sahadhyayi"
        description="Your personal reading history, goals, achievements, and bookshelf insights."
        noIndex
      />
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard" aria-label="Back to dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Reading Stats</h1>
              <p className="text-sm text-muted-foreground">
                Your verified reading habits, goals, milestones, and Passport
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReadingHistoryCsv(shelf, logs)}
              className="border-border text-foreground text-xs gap-1.5 h-9"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Export Reading History CSV
            </Button>
          </div>
        </div>

        {/* Reading Passport */}
        <ReadingPassportCard
          displayName={user.user_metadata?.full_name || user.user_metadata?.name || 'Reader'}
          avatarUrl={user.user_metadata?.avatar_url}
          completedBooksCount={completed.length}
          totalLoggedPages={totalLoggedPages}
          currentStreakDays={streak?.current ?? 0}
          topGenres={genres.map(([g]) => g)}
          badgesCount={completed.length >= 1 ? 4 : 1}
        />

        {/* Shelf Counts */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {counts.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border bg-card shadow-xs">
              <CardContent className="p-4">
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">{isLoading ? '—' : value}</div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Stats & Streak */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">This week · pages</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {logsLoading ? '—' : weekPages}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">This week · reading time</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {logsLoading
                  ? '—'
                  : weekMinutes >= 60
                  ? (weekMinutes / 60).toFixed(1) + ' h'
                  : weekMinutes + ' min'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Current streak</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {streak?.current ?? 0}{' '}
                <span className="text-sm font-normal text-muted-foreground">days</span>
              </p>
              <p className="text-xs text-muted-foreground">Best: {streak?.best ?? 0} days</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Personal Reading Goals with Pace calculation */}
        <PersonalReadingGoalsCard
          completedThisYear={completedThisYear}
          initialAnnualGoal={goal}
          initialMonthlyPagesTarget={monthlyTarget}
          monthPages={monthPages}
          weekMinutes={weekMinutes}
          onGoalUpdated={(annual, monthly) => {
            void setGoal(annual);
            setMonthlyTarget(monthly);
          }}
        />

        {/* Progressive Achievements */}
        <ProgressiveAchievements
          stats={{
            completedBooksCount: completed.length,
            totalLoggedPages,
            bestStreakDays: streak?.best ?? 0,
            currentStreakDays: streak?.current ?? 0,
            uniqueGenresCount: genreVariety,
            ratedBooksCount: rated.length,
          }}
        />

        {/* Reading Trends */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Reading Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Pages and completed books over time</p>
              <div className="flex rounded-lg border p-1 border-border">
                <Button
                  size="sm"
                  variant={trendRange === 'month' ? 'default' : 'ghost'}
                  onClick={() => setTrendRange('month')}
                  className="h-7 text-xs"
                >
                  6 months
                </Button>
                <Button
                  size="sm"
                  variant={trendRange === 'year' ? 'default' : 'ghost'}
                  onClick={() => setTrendRange('year')}
                  className="h-7 text-xs"
                >
                  12 months
                </Button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Pages read</p>
                <div className="flex h-36 items-end gap-2 border-b border-border pb-1">
                  {trendBuckets.map((bucket) => (
                    <div
                      key={bucket.key}
                      className="flex h-full flex-1 flex-col justify-end gap-1"
                      title={bucket.pages + ' pages'}
                    >
                      <span className="text-center text-[10px] text-muted-foreground">
                        {bucket.pages || ''}
                      </span>
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{
                          height: `${(bucket.pages / trendMax) * 72}%`,
                          minHeight: bucket.pages ? 4 : 0,
                        }}
                      />
                      <span className="text-center text-[10px] text-muted-foreground truncate">
                        {bucket.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total: {trendBuckets.reduce((s, b) => s + b.pages, 0).toLocaleString()} pages
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Books completed</p>
                <div className="flex h-36 items-end gap-2 border-b border-border pb-1">
                  {trendBuckets.map((bucket) => (
                    <div
                      key={bucket.key}
                      className="flex h-full flex-1 flex-col justify-end gap-1"
                      title={bucket.books + ' books completed'}
                    >
                      <span className="text-center text-[10px] text-muted-foreground">
                        {bucket.books || ''}
                      </span>
                      <div
                        className="w-full rounded-t bg-emerald-500/80"
                        style={{
                          height: `${(bucket.books / completionMax) * 72}%`,
                          minHeight: bucket.books ? 4 : 0,
                        }}
                      />
                      <span className="text-center text-[10px] text-muted-foreground truncate">
                        {bucket.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total: {trendBuckets.reduce((s, b) => s + b.books, 0)} books completed
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Reading time</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round((trendBuckets.reduce((s, b) => s + b.minutes, 0) / 60) * 10) / 10} hrs
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Monthly average · pages</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(trendBuckets.reduce((s, b) => s + b.pages, 0) / trendBuckets.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Reading Recap Card */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-foreground">
              Yearly Reading Recap · {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Books completed</p>
                <p className="text-2xl font-bold text-foreground">{completedThisYear}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pages logged</p>
                <p className="text-2xl font-bold text-foreground">{yearPages.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reading time</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((yearMinutes / 60) * 10) / 10} h
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active days</p>
                <p className="text-2xl font-bold text-foreground">{yearActiveDays}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top genre</p>
                <p className="text-lg font-semibold text-foreground">{topGenre || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average rating</p>
                <p className="text-2xl font-bold text-foreground">{avg}/5</p>
              </div>
            </div>
            <Button className="mt-4" variant="outline" onClick={copyRecap}>
              {recapCopied ? 'Recap copied!' : 'Copy recap to share'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Copy a ready-to-share summary of your reading year.
            </p>
          </CardContent>
        </Card>

        {/* Personalized Reading Insights */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-foreground">
              Personalized Reading Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Pages / active day</p>
                <p className="text-xl font-bold text-foreground">{pagesPerActiveDay}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Strongest weekday</p>
                <p className="text-lg font-semibold text-foreground">{bestReadingDay?.[0] || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {bestReadingDay ? `${bestReadingDay[1]} pages logged` : 'Log sessions to discover'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Most productive month</p>
                <p className="text-lg font-semibold text-foreground">
                  {bestMonth?.[0]
                    ? new Date(`${bestMonth[0]}-01T12:00:00`).toLocaleDateString(undefined, {
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bestMonth ? `${bestMonth[1]} pages logged` : 'Log sessions to discover'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Reading Challenge */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-foreground">
              7-Day Rolling Reading Challenge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">{challengeDays} / 7 days</p>
                <p className="text-sm text-muted-foreground">
                  Log reading on 7 different days across the past 7 days.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {challengeProgress}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${challengeProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {challengeDays >= 7
                ? 'Challenge complete! Keep your reading rhythm going.'
                : `${7 - challengeDays} more active days to complete this weekly challenge.`}
            </p>
          </CardContent>
        </Card>

        {/* Reading Personality & Taste */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-foreground">
              Reading Personality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {topGenre ? `${topGenre} enthusiast` : 'Your reader profile is emerging'}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {readerType}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {tasteType}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 28-day reading calendar */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg text-foreground">
              <span>Reading Activity Calendar · 28 Days</span>
              <span className="text-xs font-normal text-muted-foreground">
                {activeCalendarDays} active days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day) => (
                <div
                  key={day.key}
                  title={`${day.key}: ${day.pages} pages · ${day.minutes} min · ${day.sessions} sessions`}
                  aria-label={`${day.key}: ${day.minutes} minutes read`}
                  className={`aspect-square rounded-md border flex flex-col items-center justify-center text-[10px] sm:text-xs ${
                    day.sessions
                      ? 'border-primary/30 bg-primary text-primary-foreground font-semibold'
                      : 'border-border bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <span>{day.day.getDate()}</span>
                  {day.sessions > 0 && (
                    <span className="text-[8px] sm:text-[10px]">
                      {day.minutes ? `${day.minutes}m` : `${day.pages}p`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reading Sessions */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-foreground">
              Recent Reading Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(log.logged_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.journal_note || `${log.pages_read || 0} pages logged`}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  {log.pages_read ? `${log.pages_read} pages` : ''}
                  {log.minutes_read ? ` · ${log.minutes_read} min` : ''}
                </div>
              </div>
            ))}
            {!logs.length && (
              <p className="text-sm text-muted-foreground">
                Log a reading session from a book to see your history here.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild>
            <Link to="/bookshelf">Open Bookshelf</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
