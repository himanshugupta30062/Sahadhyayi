import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpen, Eye, Users, UserPlus, CalendarClock, RefreshCw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

type Period = '24h' | '7d' | '30d' | '90d';
type Item = { name: string; count: number; source?: string; medium?: string };
interface AnalyticsData {
  current: { visitors: number; sessions: number; pageviews: number; signups: number; activeReaders: number; signupConversion: number };
  previous: { visitors: number; sessions: number; pageviews: number; signups: number; activeReaders: number };
  trend: { day: string; pageviews: number; sessions: number }[];
  topPages: Item[];
  entryPages: Item[];
  referrers: Item[];
  campaigns: Item[];
  countries: Item[];
  devices: Item[];
  engagement: { weeklyActiveReaders: number; monthlyActiveReaders: number; bookOpens: number; bookSaves: number; readingStarts: number; readingCompletions: number; groupParticipation: number };
  funnel: Item[];
  definitions: Record<string, string>;
  lastUpdated: string;
}

const periods: { id: Period; label: string; days: number }[] = [
  { id: '24h', label: '24 hours', days: 1 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
];

const formatDelta = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 'No change' : 'New in this period';
  const pct = ((current - previous) / previous) * 100;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs previous period`;
};

const Kpi = ({ label, value, prior, icon: Icon, suffix = '' }: {
  label: string; value: number; prior?: number; icon: React.ElementType; suffix?: string;
}) => (
  <Card>
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4" /></div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}{suffix}</div>
      {prior !== undefined && <p className="mt-1 text-xs text-muted-foreground">{formatDelta(value, prior)}</p>}
    </CardContent>
  </Card>
);

const Breakdown = ({ title, rows, empty }: { title: string; rows: Item[]; empty: string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
    <CardContent>
      {rows.length ? <ol className="space-y-2">{rows.map((row, i) => (
        <li key={`${row.name}-${i}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-muted-foreground">{row.name}{row.source ? ` · ${row.source}` : ''}</span>
          <span className="shrink-0 tabular-nums font-medium text-foreground">{row.count.toLocaleString()}</span>
        </li>
      ))}</ol> : <p className="text-sm text-muted-foreground">{empty}</p>}
    </CardContent>
  </Card>
);

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<Period>('30d');
  const roleQuery = useQuery({
    queryKey: ['admin-analytics-role', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      return data === true;
    },
    staleTime: 60_000,
    retry: false,
  });
  const days = periods.find((item) => item.id === period)?.days ?? 30;
  const analytics = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', user?.id, days],
    enabled: roleQuery.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_analytics', { p_days: days });
      if (error) throw error;
      return data as AnalyticsData;
    },
    staleTime: 60_000,
    retry: false,
  });

  const data = analytics.data;
  const busy = roleQuery.isLoading || analytics.isLoading;

  return (
    <main className="min-h-screen bg-background">
      <SEO title="Admin Analytics | Sahadhyayi" description="Private, aggregated website and reading analytics." />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">Private admin area</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Traffic and reading engagement, aggregated from recorded events. Visitor identifiers are pseudonymous estimates.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Analytics date range">
            {periods.map((item) => <Button key={item.id} size="sm" variant={period === item.id ? 'default' : 'outline'} onClick={() => setPeriod(item.id)}>{item.label}</Button>)}
            <Button size="sm" variant="outline" aria-label="Refresh analytics" onClick={() => void analytics.refetch()} disabled={busy}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </header>

        {!user && <Card><CardContent className="p-6 text-sm text-muted-foreground">Sign in with an administrator account to view analytics.</CardContent></Card>}
        {user && roleQuery.isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}
        {user && roleQuery.error && <Card role="alert"><CardContent className="p-6 text-sm text-destructive">Unable to verify administrator access.</CardContent></Card>}
        {user && roleQuery.data === false && <Card><CardContent className="p-6 text-sm text-muted-foreground">This page is restricted to administrators.</CardContent></Card>}
        {roleQuery.data === true && analytics.error && <Card role="alert"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-6 text-sm text-destructive"><span>Analytics are unavailable. Confirm the latest database migration is applied, then retry.</span><Button size="sm" variant="outline" onClick={() => void analytics.refetch()}>Retry</Button></CardContent></Card>}
        {roleQuery.data === true && analytics.isLoading && <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{Array.from({length: 6}, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>}

        {data && <>
          <section aria-label="Key performance indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Unique visitors*" value={data.current.visitors} prior={data.previous.visitors} icon={Users} />
            <Kpi label="Sessions" value={data.current.sessions} prior={data.previous.sessions} icon={CalendarClock} />
            <Kpi label="Pageviews" value={data.current.pageviews} prior={data.previous.pageviews} icon={Eye} />
            <Kpi label="Signups" value={data.current.signups} prior={data.previous.signups} icon={UserPlus} />
            <Kpi label="Active readers" value={data.current.activeReaders} prior={data.previous.activeReaders} icon={Activity} />
            <Kpi label="Signup conversion*" value={data.current.signupConversion} suffix="%" icon={UserPlus} />
          </section>
          <p className="text-xs text-muted-foreground">* Estimates. Signup conversion is aggregate signups divided by measured unique visitors, not a linked visitor cohort. Previous period uses the same duration immediately before the selected range.</p>

          <Card>
            <CardHeader><CardTitle className="text-base">Daily traffic</CardTitle></CardHeader>
            <CardContent>
              {data.trend.length ? <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString()} />
                    <Line type="monotone" dataKey="pageviews" stroke="hsl(var(--brand-primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sessions" stroke="hsl(var(--brand-secondary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div> : <p className="text-sm text-muted-foreground">No daily traffic data is available for this period.</p>}
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span>Pageviews</span><span>Sessions</span></div>
            </CardContent>
          </Card>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Breakdown title="Top pages" rows={data.topPages} empty="No pageview events recorded." />
            <Breakdown title="Entry pages" rows={data.entryPages} empty="Session identifiers are not available for this period yet." />
            <Breakdown title="Referrers" rows={data.referrers} empty="No referrer data recorded." />
            <Breakdown title="UTM campaigns" rows={data.campaigns} empty="No campaign-tagged visits recorded." />
            <Breakdown title="Countries · 10+ sessions" rows={data.countries} empty="No country groups meet the privacy threshold." />
            <Breakdown title="Devices · 10+ sessions" rows={data.devices} empty="No device groups meet the privacy threshold." />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Reading engagement</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Object.entries(data.engagement).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    weeklyActiveReaders: 'Weekly active readers',
                    monthlyActiveReaders: 'Monthly active readers',
                    bookOpens: 'Book opens',
                    bookSaves: 'Book bookmarks saved',
                    readingStarts: 'Reading starts',
                    readingCompletions: 'Chapter completions',
                    groupParticipation: 'Group joins',
                  };
                  return <div key={key} className="rounded-lg bg-muted/40 p-3">
                    <div className="text-xl font-semibold tabular-nums">{value.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{labels[key] ?? key}</div>
                  </div>;
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Visit to reading funnel</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.funnel.map((step, index) => {
                  const first = data.funnel[0]?.count ?? 0;
                  const width = first ? Math.max(2, (step.count / first) * 100) : 0;
                  return <div key={step.name}>
                    <div className="mb-1 flex justify-between text-xs"><span>{index + 1}. {step.name}</span><span className="tabular-nums">{step.count.toLocaleString()}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${width}%` }} /></div>
                  </div>;
                })}
              </CardContent>
            </Card>
          </section>

          <details className="rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium">Metric definitions and data limits</summary>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(data.definitions).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize">{key}</dt><dd className="mt-1 text-xs text-muted-foreground">{value}</dd></div>)}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Legacy records have no session or visitor ID and are excluded from those estimates. Historical device and country values are retained but are shown only after aggregation thresholds are met.</p>
          </details>
          <p className="text-right text-xs text-muted-foreground">Updated {new Date(data.lastUpdated).toLocaleString()}</p>
        </>}
      </div>
    </main>
  );
};

export default AdminAnalytics;
