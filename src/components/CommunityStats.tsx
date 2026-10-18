import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  Clock3,
  Eye,
  Globe2,
  MapPin,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';

export type CountryStat = {
  name: string;
  visits: number;
  code?: string;
};

export type CityStat = {
  name: string;
  visits: number;
};

export type HourlyStat = {
  /** Local-time label supplied by the Edge Function, e.g. "4 PM". */
  hour: string;
  visits: number;
};

export type CommunityMember = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  activityCount: number | null;
  activityBreakdown?: string;
};

/** Missing metrics are null, not invented zeroes or estimates. */
export type CommunityPulseData = {
  visits24h: number | null;
  uniqueVisitors24h: number | null;
  newMembers24h: number | null;
  totalMembers: number | null;
  totalVisits: number | null;
  topCity: CityStat | null;
  hourlyVisits: HourlyStat[];
  topMembers: CommunityMember[];
  countries: CountryStat[];
  cities: CityStat[];
  engagement: {
    bookViews: number | null;
    readingProgressUpdates: number | null;
    groupJoins: number | null;
    discussions: number | null;
  };
  updatedAt: string | null;
};

type CommunityPulseDashboardProps = {
  data: CommunityPulseData;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

const EMPTY_DATA: CommunityPulseData = {
  visits24h: null,
  uniqueVisitors24h: null,
  newMembers24h: null,
  totalMembers: null,
  totalVisits: null,
  topCity: null,
  hourlyVisits: [],
  topMembers: [],
  countries: [],
  cities: [],
  engagement: {
    bookViews: null,
    readingProgressUpdates: null,
    groupJoins: null,
    discussions: null,
  },
  updatedAt: null,
};

const numberFormat = new Intl.NumberFormat('en-IN');

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function displayNumber(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? numberFormat.format(value)
    : '—';
}

function formatUpdatedAt(value?: string | null): string {
  if (!value) return 'Update time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Update time unavailable';
  return `Updated ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'R';
}

const COUNTRY_MAP: Record<string, string> = {
  IN: 'India', US: 'United States', FR: 'France', CA: 'Canada', GB: 'United Kingdom',
  DE: 'Germany', SG: 'Singapore', ES: 'Spain', NL: 'Netherlands', ID: 'Indonesia',
  BR: 'Brazil', CN: 'China', SE: 'Sweden', VN: 'Vietnam', NG: 'Nigeria', UA: 'Ukraine',
  AU: 'Australia', PL: 'Poland', AR: 'Argentina', LK: 'Sri Lanka', JP: 'Japan',
  KR: 'South Korea', RU: 'Russia', MX: 'Mexico', IT: 'Italy', AE: 'United Arab Emirates',
};

function Panel({
  title,
  subtitle,
  icon,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/90 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          {icon}
        </span>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = 'emerald',
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: 'emerald' | 'blue' | 'violet' | 'amber' | 'slate';
}) {
  const accents = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/90 sm:p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`}>{icon}</span>
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{label}</p>
      </div>
      <p className="mt-3 truncate font-mono text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{children}</div>;
}

function HourlyActivity({ data }: { data: HourlyStat[] }) {
  if (!data.length) return <EmptyState>Hourly activity is not available yet.</EmptyState>;

  const max = Math.max(1, ...data.map((item) => item.visits));
  const peak = Math.max(0, ...data.map((item) => item.visits));
  const labelAt = (fraction: number) => data[Math.min(data.length - 1, Math.floor((data.length - 1) * fraction))]?.hour ?? '';

  return (
    <>
      <div className="flex h-36 items-end gap-1.5 sm:h-40" role="img" aria-label="Hourly visits for the last 24 hours">
        {data.map((item, index) => {
          const height = item.visits <= 0 ? 2 : Math.max(5, (item.visits / max) * 100);
          const isPeak = item.visits === peak && peak > 0;
          return (
            <div key={`${item.hour}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="relative flex h-full items-end">
                <div
                  title={`${item.hour}: ${displayNumber(item.visits)} visits`}
                  className={`w-full rounded-t-md transition-colors ${isPeak ? 'bg-emerald-700 dark:bg-emerald-500' : 'bg-emerald-100 group-hover:bg-emerald-300 dark:bg-emerald-950/60 dark:group-hover:bg-emerald-700'}`}
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-slate-400 dark:text-slate-500 sm:text-xs">
        <span>{labelAt(0)}</span><span>{labelAt(0.25)}</span><span>{labelAt(0.5)}</span><span>{labelAt(0.75)}</span><span>{labelAt(1)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="h-2 w-2 rounded-sm bg-emerald-700 dark:bg-emerald-500" />
        <span>Peak: {displayNumber(peak)} visits per bucket</span>
      </div>
    </>
  );
}

function Leaderboard({ members }: { members: CommunityMember[] }) {
  if (!members.length) return <EmptyState>No member activity is available for this period.</EmptyState>;

  return (
    <div className="space-y-3">
      {members.slice(0, 5).map((member, index) => (
        <div key={member.id} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">{String(index + 1).padStart(2, '0')}</span>
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700" loading="lazy" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">{initials(member.displayName)}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{member.displayName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.activityBreakdown || 'Tracked community activity'}</p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-200/70 bg-slate-50 px-2 py-1 font-mono text-sm font-semibold tabular-nums text-slate-800 dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-200">{displayNumber(member.activityCount)}</span>
        </div>
      ))}
      <p className="border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-400 dark:border-slate-800 dark:text-slate-500">Ranked by tracked engagement events, not visits.</p>
    </div>
  );
}

function RankedList({ items, kind }: { items: Array<{ name: string; visits: number }>; kind: 'country' | 'city' }) {
  if (!items.length) return <EmptyState>No {kind} data available for this period.</EmptyState>;
  const max = Math.max(1, ...items.map((item) => item.visits));

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item, index) => (
        <div key={`${item.name}-${index}`}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-slate-600 dark:text-slate-300"><span className="mr-2 text-slate-400 dark:text-slate-500">{index + 1}.</span>{item.name}</span>
            <span className="shrink-0 font-mono font-medium tabular-nums text-slate-800 dark:text-slate-100">{displayNumber(item.visits)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500" style={{ width: `${Math.max(item.visits > 0 ? 3 : 0, (item.visits / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EngagementRow({ label, value }: { label: string; value: number | null }) {
  const tracked = value !== null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`font-mono text-sm font-semibold tabular-nums ${tracked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{tracked ? displayNumber(value) : 'Not tracked'}</span>
    </div>
  );
}

export function CommunityPulseDashboard({ data, loading = false, error = null, onRefresh }: CommunityPulseDashboardProps) {
  const topCityLabel = data.topCity?.name ?? '—';
  const topCityDetail = data.topCity ? `${displayNumber(data.topCity.visits)} visits` : 'No city data';

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-5 text-slate-900 transition-colors dark:bg-[#121417] dark:text-slate-100 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-800/40 bg-emerald-900 text-emerald-50 shadow-sm dark:bg-emerald-950"><BookOpen size={22} aria-hidden="true" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-400">Sahadhyayi · Community</p>
              <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Community Pulse</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A compact view of traffic, readers, and engagement.</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><Clock3 size={14} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />Last 24 hours</div>
            <button type="button" onClick={onRefresh} disabled={!onRefresh || loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600" aria-label="Refresh community stats">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />{loading ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <span>Could not refresh community data: {error}</span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="shrink-0 text-xs font-semibold underline hover:no-underline"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {loading && !data.updatedAt && <div role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading real community statistics…</div>}

        <section aria-label="Community key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Visits" value={displayNumber(data.visits24h)} detail="Last 24 hours" icon={<Eye size={16} />} accent="blue" />
          <MetricCard label="Unique visitors" value={displayNumber(data.uniqueVisitors24h)} detail={data.uniqueVisitors24h === null ? 'Unavailable' : 'Last 24 hours'} icon={<Users size={16} />} accent="violet" />
          <MetricCard label="New members" value={displayNumber(data.newMembers24h)} detail={data.newMembers24h === null ? 'Unavailable' : 'Joined in 24h'} icon={<UserPlus size={16} />} accent="emerald" />
          <MetricCard label="All members" value={displayNumber(data.totalMembers)} detail="Registered accounts" icon={<Users size={16} />} accent="slate" />
          <MetricCard label="All visits" value={displayNumber(data.totalVisits)} detail="Recorded total" icon={<TrendingUp size={16} />} accent="amber" />
          <MetricCard label="Top city" value={topCityLabel} detail={topCityDetail} icon={<MapPin size={16} />} accent="emerald" />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Panel title="Activity throughout the day" subtitle="Visits by hour · Last 24 hours" icon={<Activity size={18} />} className="xl:col-span-7"><HourlyActivity data={data.hourlyVisits} /></Panel>
          <Panel title="Top community members" subtitle="Most active in the last 24 hours" icon={<Trophy size={18} />} className="xl:col-span-5"><Leaderboard members={data.topMembers} /></Panel>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Panel title="Top countries" subtitle="Ranked by visits · Last 24 hours" icon={<Globe2 size={18} />}><RankedList items={data.countries} kind="country" /></Panel>
          <Panel title="Top cities" subtitle="Ranked by visits · Last 24 hours" icon={<MapPin size={18} />}><RankedList items={data.cities} kind="city" /></Panel>
          <Panel title="Reading engagement" subtitle="Tracked events · Last 24 hours" icon={<MessageCircle size={18} />}>
            <EngagementRow label="Book views" value={data.engagement.bookViews} />
            <EngagementRow label="Reading progress updates" value={data.engagement.readingProgressUpdates} />
            <EngagementRow label="Reading group joins" value={data.engagement.groupJoins} />
            <EngagementRow label="Discussions / comments" value={data.engagement.discussions} />
            <p className="mt-3 text-[11px] leading-4 text-slate-400 dark:text-slate-500">Metrics not returned by the backend are shown as unavailable, never estimated.</p>
          </Panel>
        </section>

        <footer className="flex flex-col gap-1 border-t border-slate-200 px-1 pt-3 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{formatUpdatedAt(data.updatedAt)}</span><span>Display only aggregate analytics and public profile fields.</span>
        </footer>
      </div>
    </div>
  );
}

/** Converts the Edge Function response into the UI model. It never invents missing values. */
function normalizeStatsResponse(raw: unknown): CommunityPulseData {
  if (!raw || typeof raw !== 'object') throw new Error('The community-stats endpoint returned an invalid response.');
  const result = raw as Record<string, any>;
  if (result.error) throw new Error(String(result.error));
  if (typeof result.totalVisits !== 'number' || typeof result.last24hVisits !== 'number') {
    throw new Error('The community-stats endpoint is missing required visit totals.');
  }

  const hourlyVisits: HourlyStat[] = Array.isArray(result.hourlyActivity)
    ? result.hourlyActivity.flatMap((item: any) => {
        const visits = asNumber(item?.count);
        if (visits === null) return [];
        return [{ hour: String(item?.label ?? (typeof item?.hourIndex === 'number' ? `${item.hourIndex}:00` : 'Hour')), visits }];
      })
    : [];

  const countries: CountryStat[] = Array.isArray(result.topCountries)
    ? result.topCountries.flatMap((item: any) => {
        const visits = asNumber(item?.count);
        if (visits === null) return [];
        const code = typeof item?.code === 'string' ? item.code : undefined;
        const name = typeof item?.name === 'string' && item.name.trim()
          ? item.name
          : code ? (COUNTRY_MAP[code.toUpperCase()] ?? code) : 'Unknown country';
        return [{ name, visits, code }];
      })
    : [];

  const cities: CityStat[] = Array.isArray(result.topCities)
    ? result.topCities.flatMap((item: any) => {
        const visits = asNumber(item?.count ?? item?.visits);
        if (visits === null || typeof item?.name !== 'string' || !item.name.trim()) return [];
        return [{ name: item.name, visits }];
      })
    : [];

  const topMembers: CommunityMember[] = Array.isArray(result.topMembers)
    ? result.topMembers.flatMap((item: any) => {
        const id = item?.userId == null ? null : String(item.userId);
        if (!id) return [];
        const breakdown = item?.breakdown && typeof item.breakdown === 'object' ? item.breakdown : null;
        const activityBreakdown = breakdown
          ? [
              asNumber(breakdown.posts) !== null ? `${asNumber(breakdown.posts)} posts` : null,
              asNumber(breakdown.comments) !== null ? `${asNumber(breakdown.comments)} comments` : null,
              asNumber(breakdown.messages) !== null ? `${asNumber(breakdown.messages)} messages` : null,
              asNumber(breakdown.chapters) !== null ? `${asNumber(breakdown.chapters)} chapters` : null,
            ].filter(Boolean).join(' · ')
          : '';
        return [{
          id,
          displayName: typeof item?.name === 'string' && item.name.trim() ? item.name : 'Community member',
          avatarUrl: typeof item?.avatarUrl === 'string' && item.avatarUrl.trim() ? item.avatarUrl : null,
          activityCount: asNumber(item?.activityCount),
          activityBreakdown,
        }];
      })
    : [];

  const readingEngagement = result.readingEngagement && typeof result.readingEngagement === 'object'
    ? result.readingEngagement
    : {};
  const countFrom = (key: string) => asNumber(readingEngagement?.[key]?.count);
  const topCityFromPayload = result.mostVisitedCity24h;
  const topCityVisits = asNumber(topCityFromPayload?.count);
  const topCity: CityStat | null = topCityFromPayload
    && typeof topCityFromPayload.name === 'string'
    && topCityVisits !== null
    ? { name: topCityFromPayload.name, visits: topCityVisits }
    : (cities[0] ?? null);

  return {
    visits24h: asNumber(result.last24hVisits),
    uniqueVisitors24h: asNumber(result.uniqueVisitors24h),
    newMembers24h: asNumber(result.newSignups24h),
    totalMembers: asNumber(result.totalSignups),
    totalVisits: asNumber(result.totalVisits),
    topCity,
    hourlyVisits,
    topMembers,
    countries,
    cities,
    engagement: {
      bookViews: countFrom('bookViews'),
      readingProgressUpdates: countFrom('readingProgressUpdates'),
      groupJoins: countFrom('groupJoins'),
      discussions: countFrom('discussions'),
    },
    updatedAt: typeof result.lastUpdated === 'string' ? result.lastUpdated : null,
  };
}

const DASHBOARD_CACHE_KEY = 'community_pulse_dashboard_cache_v1';

function loadCachedDashboardData(): CommunityPulseData | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveCachedDashboardData(data: CommunityPulseData): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

/** Uses one server-side aggregate endpoint; no client-side synthetic analytics or N+1 fallbacks. */
export default function CommunityStats() {
  const [data, setData] = useState<CommunityPulseData>(() => loadCachedDashboardData() ?? EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const fetchLiveStats = useCallback(async (manual = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (manual || !hasLoadedRef.current) setLoading(true);
    try {
      const { data: response, error: invocationError } = await supabase.functions.invoke('community-stats', {
        body: { timeframe: '24h' },
      });
      if (invocationError) throw invocationError;

      const nextData = normalizeStatsResponse(response);
      if (mountedRef.current) {
        setData(nextData);
        saveCachedDashboardData(nextData);
        setError(null);
        hasLoadedRef.current = true;
      }
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Unable to load community statistics.';
      if (mountedRef.current) setError(message);
      console.error('Community Pulse refresh failed:', cause);
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchLiveStats(false);
    const intervalId = window.setInterval(() => void fetchLiveStats(false), 60_000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [fetchLiveStats]);

  return <CommunityPulseDashboard data={data} loading={loading} error={error} onRefresh={() => void fetchLiveStats(true)} />;
}
