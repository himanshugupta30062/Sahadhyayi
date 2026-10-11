import React from 'react';
import { Activity, BookOpen, MessageCircle, Radio, Users } from 'lucide-react';
import { useCommunityStats } from '@/hooks/useCommunityStats';

const Metric = ({ icon: Icon, label, value, help }: {
  icon: React.ElementType; label: string; value: number | null; help: string;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 text-brand-primary" />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
      {value === null ? '—' : value.toLocaleString()}
    </div>
    <p className="mt-1 text-xs text-muted-foreground">{help}</p>
  </div>
);

const CommunityStats = () => {
  const { stats, isLoading, error, fetchStats } = useCommunityStats();
  const points = stats?.activityTrend ?? [];
  const max = Math.max(1, ...points.map((point) => point.count));
  const coordinates = points.map((point, index) => {
    const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 100;
    const y = 32 - (point.count / max) * 28;
    return `${x},${y}`;
  }).join(' ');

  return (
    <section aria-labelledby="community-pulse-title" className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Sahadhyayi community</p>
          <h2 id="community-pulse-title" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Community Pulse</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">A snapshot of readers, the public library, and recent shared reading activity.</p>
        </div>
        {stats?.lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Updated {new Date(stats.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Community data is temporarily unavailable. No counts are being shown.</span>
            <button className="font-medium underline underline-offset-4" onClick={() => void fetchStats()}>Try again</button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Users} label="Registered readers" value={error || isLoading ? null : stats?.registeredReaders ?? null} help="Profiles in the community" />
        <Metric icon={BookOpen} label="Public library" value={error || isLoading ? null : stats?.eligibleBooks ?? null} help="Distinct book titles in the Library" />
        <Metric icon={Radio} label="Active reading rooms" value={error || isLoading ? null : stats?.activeRooms ?? null} help="Rooms with activity in the past 30 days" />
        <Metric icon={MessageCircle} label="Community activity" value={error || isLoading ? null : stats?.communityActivity ?? null} help="Room messages, replies and completed chapters in 30 days" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="h-4 w-4 text-brand-primary" />Daily community activity</h3>
            <p className="mt-1 text-xs text-muted-foreground">Replies, room messages and completed chapters · last 30 days</p>
          </div>
          {!isLoading && !error && points.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">{points.reduce((sum, point) => sum + point.count, 0).toLocaleString()} activities</span>
          )}
        </div>
        {isLoading ? (
          <div className="mt-4 h-16 animate-pulse rounded-lg bg-muted" aria-label="Loading community activity" />
        ) : error ? (
          <p className="mt-4 text-sm text-muted-foreground">Trend unavailable.</p>
        ) : points.length && points.some((point) => point.count > 0) ? (
          <div className="mt-3">
            <svg viewBox="0 0 100 36" role="img" aria-label="Daily community activity over the last 30 days" className="h-16 w-full overflow-visible">
              <polyline points={coordinates} fill="none" stroke="hsl(var(--brand-primary))" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div className="flex justify-between text-[11px] text-muted-foreground"><span>30 days ago</span><span>Today</span></div>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-muted/40 px-3 py-3 text-sm text-muted-foreground">No community activity has been recorded in this period yet.</p>
        )}
      </div>
    </section>
  );
};

export default CommunityStats;
