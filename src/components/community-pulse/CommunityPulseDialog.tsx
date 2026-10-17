import React, { useState, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Globe2,
  Laptop,
  Link2,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
import {
  PulseStats,
  RecentVisitor,
  Change,
  BreakdownItem,
  HourPoint,
  useCommunityPulse,
} from '@/hooks/useCommunityPulse';
import { useToast } from '@/hooks/use-toast';

export type CommunityPulseDialogProps = {
  open: boolean;
  onClose: () => void;
  pulseState?: ReturnType<typeof useCommunityPulse>;
};

const number = (value: number) => new Intl.NumberFormat().format(value);

const changeLabel = (change?: Change) =>
  change ? `${change.value > 0 ? '+' : ''}${change.value}%` : null;

function getFlagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  AU: 'Australia',
  FR: 'France',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  NL: 'Netherlands',
  BR: 'Brazil',
  JP: 'Japan',
};

function formatCountryName(nameOrCode: string): string {
  const upper = nameOrCode.toUpperCase();
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  if (nameOrCode.length === 2) {
    try {
      const displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(upper);
      if (displayName) return displayName;
    } catch {
      // ignore
    }
  }
  return nameOrCode;
}

function Panel({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-white/[0.09] bg-[#111614] p-4.5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-100">
          <span className="text-[#D5B16D]">{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export const CommunityPulseDialog: React.FC<CommunityPulseDialogProps> = ({
  open,
  onClose,
  pulseState: externalPulseState,
}) => {
  const internalPulseState = useCommunityPulse(open);
  const pulse = externalPulseState || internalPulseState;

  const {
    isAdmin,
    timeframe,
    setTimeframe,
    stats,
    loading,
    error,
    refetchStats,
    filteredVisitors,
    paginatedVisitors,
    visitorsLoading,
    visitorsError,
    refetchVisitors,
    visitorSearch,
    setVisitorSearch,
    countryFilter,
    setCountryFilter,
    deviceFilter,
    setDeviceFilter,
    selectedVisitor,
    setSelectedVisitor,
    page,
    setPage,
    totalPages,
  } = pulse;

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'visitors' | 'insights'>('overview');
  const [metricView, setMetricView] = useState<'views' | 'unique'>('views');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [showAllReferrers, setShowAllReferrers] = useState(false);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleCopyText = (text: string, label: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      toast({
        title: 'Copied to clipboard',
        description: `${label}: ${text}`,
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not access clipboard.',
        variant: 'destructive',
      });
    }
  };

  if (!open) return null;

  // Max count for hourly chart scale
  const hourlyData = stats?.hourlyActivity || [];
  const maxHourlyCount = Math.max(1, ...hourlyData.map(h => h.count));
  const chartPeak = Math.ceil(maxHourlyCount / 50) * 50 || 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl border border-white/[0.09] bg-[#0B0D0C] text-stone-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4.5 border-b border-white/[0.08] bg-[#0E1210]/90">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#16201b] border border-[#27392f] flex items-center justify-center text-[#D5B16D] shadow-inner flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 id="pulse-modal-title" className="text-base sm:text-lg font-bold text-stone-100 tracking-tight">
                  Community Pulse
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
                {stats?.isStale && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
                    Cached
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                A real-time picture of our growing reading community
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 border-b border-white/[0.08] bg-[#0B0D0C]">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111614] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('visitors')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'visitors'
                    ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Recent Visitors
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#D5B16D]/15 text-[#D5B16D] font-bold">
                  Admin
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'insights'
                  ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Insights
            </button>
          </div>

          {/* Controls: Timeframe & Refresh */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value as '24h' | '7d' | '30d')}
                aria-label="Select timeframe"
                className="appearance-none bg-[#111614] border border-white/[0.09] hover:border-white/20 text-stone-200 text-xs sm:text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D5B16D] cursor-pointer"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                if (activeTab === 'visitors') {
                  refetchVisitors();
                } else {
                  refetchStats();
                }
              }}
              disabled={loading || visitorsLoading}
              title="Refresh metrics"
              aria-label="Refresh metrics"
              className="p-2 rounded-lg bg-[#111614] border border-white/[0.09] hover:border-white/20 text-stone-300 hover:text-[#D5B16D] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading || visitorsLoading ? 'animate-spin text-[#D5B16D]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Page Views */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <Eye className="w-4 h-4" />
                    </span>
                    {stats?.pageViewsChange && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/30 flex items-center gap-0.5">
                        ↑ {changeLabel(stats.pageViewsChange)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
                      {number(stats?.pageViews ?? 0)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">Page views</div>
                    <div className="text-[10px] text-stone-500 mt-1">vs previous period</div>
                  </div>
                </div>

                {/* 2. Unique Visitors */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <Users className="w-4 h-4" />
                    </span>
                    {stats?.uniqueVisitorsChange && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/30 flex items-center gap-0.5">
                        ↑ {changeLabel(stats.uniqueVisitorsChange)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
                      {number(stats?.uniqueVisitors ?? 0)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">Unique visitors</div>
                    <div className="text-[10px] text-stone-500 mt-1">vs previous period</div>
                  </div>
                </div>

                {/* 3. New Readers */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    {stats?.newReadersChange && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/30 flex items-center gap-0.5">
                        ↑ {changeLabel(stats.newReadersChange)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
                      {number(stats?.newReaders ?? 0)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">New readers</div>
                    <div className="text-[10px] text-stone-500 mt-1">vs previous period</div>
                  </div>
                </div>

                {/* 4. Avg. Time on Site */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <Clock3 className="w-4 h-4" />
                    </span>
                    {stats?.avgTimeChange && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/30 flex items-center gap-0.5">
                        ↑ {changeLabel(stats.avgTimeChange)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
                      {stats?.avgTimeOnSite || '3m 24s'}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">Avg. time on site</div>
                    <div className="text-[10px] text-stone-500 mt-1">vs previous period</div>
                  </div>
                </div>
              </div>

              {/* Second Row: Visitor Activity Chart (Left) + Visitors by Country (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hourly Visitor Activity */}
                <div className="lg:col-span-2">
                  <Panel
                    title="Visitor Activity"
                    icon={<Eye className="w-4 h-4" />}
                    action={
                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <span>Metric:</span>
                        <select
                          value={metricView}
                          onChange={e => setMetricView(e.target.value as 'views' | 'unique')}
                          className="bg-[#18241e] border border-white/10 rounded px-2 py-0.5 text-stone-200 text-xs focus:outline-none"
                        >
                          <option value="views">Page views</option>
                          <option value="unique">Unique visitors</option>
                        </select>
                      </div>
                    }
                  >
                    {/* Bar Chart Container */}
                    <div className="h-48 pt-4 pb-2 flex flex-col justify-end">
                      <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-36 border-b border-white/[0.08] pb-1 px-1">
                        {hourlyData.length > 0 ? (
                          hourlyData.map((h, i) => {
                            const heightPct = Math.max(6, Math.min(100, Math.round((h.count / chartPeak) * 100)));
                            const isPeak = h.isPeak;
                            return (
                              <div
                                key={i}
                                className="group relative flex-1 flex flex-col items-center justify-end h-full"
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                                  <div className="bg-[#18241e] text-stone-100 text-[10px] py-1 px-2 rounded border border-white/10 shadow-lg whitespace-nowrap">
                                    <div className="font-semibold">{h.label}</div>
                                    <div className="text-[#D5B16D]">{h.count} views</div>
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-[#18241e] rotate-45 border-r border-b border-white/10 -mt-0.5" />
                                </div>

                                {/* Bar */}
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full max-w-[14px] rounded-t-sm transition-all duration-300 ${
                                    isPeak
                                      ? 'bg-gradient-to-t from-[#B8934E] to-[#F1D79E] shadow-[0_0_8px_rgba(213,177,109,0.4)]'
                                      : 'bg-[#D5B16D]/80 hover:bg-[#D5B16D]'
                                  }`}
                                />
                              </div>
                            );
                          })
                        ) : (
                          <div className="w-full flex items-center justify-center text-xs text-stone-500 py-10">
                            No hourly visits recorded for this timeframe yet
                          </div>
                        )}
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-between text-[10px] text-stone-500 pt-2 px-1">
                        <span>12AM</span>
                        <span>3AM</span>
                        <span>6AM</span>
                        <span>9AM</span>
                        <span>12PM</span>
                        <span>3PM</span>
                        <span>6PM</span>
                        <span>9PM</span>
                      </div>
                    </div>
                  </Panel>
                </div>

                {/* Visitors by Country */}
                <div className="lg:col-span-1">
                  <Panel
                    title="Visitors by Country"
                    icon={<Globe2 className="w-4 h-4" />}
                    action={
                      (stats?.countries?.length ?? 0) > 5 && (
                        <button
                          onClick={() => setShowAllCountries(!showAllCountries)}
                          className="text-xs text-[#D5B16D] hover:underline"
                        >
                          {showAllCountries ? 'Show less' : 'View all >'}
                        </button>
                      )
                    }
                  >
                    <div className="space-y-3 pt-1">
                      {(stats?.countries || []).slice(0, showAllCountries ? 15 : 6).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="text-base select-none">{getFlagEmoji(c.code)}</span>
                          <span className="w-24 truncate text-stone-300 font-medium">
                            {formatCountryName(c.name)}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.max(3, c.percent))}%` }}
                              className="h-full bg-[#D5B16D] rounded-full transition-all duration-500"
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-stone-400">
                            {c.percent}%
                          </span>
                        </div>
                      ))}

                      {(!stats?.countries || stats.countries.length === 0) && (
                        <div className="text-xs text-stone-500 py-6 text-center">
                          No country geolocation data recorded yet
                        </div>
                      )}
                    </div>
                  </Panel>
                </div>
              </div>

              {/* Third Row: Top Pages, Devices, Referrers (3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Top Pages */}
                <Panel
                  title="Top Pages"
                  icon={<BookOpen className="w-4 h-4" />}
                  action={
                    (stats?.topPages?.length ?? 0) > 5 && (
                      <button
                        onClick={() => setShowAllPages(!showAllPages)}
                        className="text-xs text-[#D5B16D] hover:underline"
                      >
                        {showAllPages ? 'Show less' : 'View all >'}
                      </button>
                    )
                  }
                >
                  <div className="space-y-3 pt-1">
                    {(stats?.topPages || []).slice(0, showAllPages ? 10 : 5).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-28 truncate font-mono text-stone-300" title={p.name}>
                          {p.name}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(4, p.percent))}%` }}
                            className="h-full bg-[#D5B16D] rounded-full transition-all"
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-stone-400">
                          {p.percent}%
                        </span>
                      </div>
                    ))}
                    {(!stats?.topPages || stats.topPages.length === 0) && (
                      <div className="text-xs text-stone-500 py-6 text-center">
                        No page activity records found
                      </div>
                    )}
                  </div>
                </Panel>

                {/* 2. Devices */}
                <Panel title="Devices" icon={<Laptop className="w-4 h-4" />}>
                  <div className="space-y-3.5 pt-1">
                    {(stats?.devices || []).map((d, i) => {
                      const dt = d.name.toLowerCase();
                      const Icon = dt.includes('mobile')
                        ? Smartphone
                        : dt.includes('tablet')
                        ? Tablet
                        : Monitor;
                      return (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <Icon className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          <span className="w-20 truncate text-stone-300 font-medium capitalize">
                            {d.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.max(4, d.percent))}%` }}
                              className="h-full bg-[#D5B16D] rounded-full transition-all"
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-stone-400">
                            {d.percent}%
                          </span>
                        </div>
                      );
                    })}
                    {(!stats?.devices || stats.devices.length === 0) && (
                      <div className="text-xs text-stone-500 py-6 text-center">
                        No device metrics recorded
                      </div>
                    )}
                  </div>
                </Panel>

                {/* 3. Referrers */}
                <Panel
                  title="Referrers"
                  icon={<Link2 className="w-4 h-4" />}
                  action={
                    (stats?.referrers?.length ?? 0) > 5 && (
                      <button
                        onClick={() => setShowAllReferrers(!showAllReferrers)}
                        className="text-xs text-[#D5B16D] hover:underline"
                      >
                        {showAllReferrers ? 'Show less' : 'View all >'}
                      </button>
                    )
                  }
                >
                  <div className="space-y-3 pt-1">
                    {(stats?.referrers || []).slice(0, showAllReferrers ? 10 : 5).map((r, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-24 truncate text-stone-300 font-medium">
                          {r.name}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(4, r.percent))}%` }}
                            className="h-full bg-[#D5B16D] rounded-full transition-all"
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-stone-400">
                          {r.percent}%
                        </span>
                      </div>
                    ))}
                    {(!stats?.referrers || stats.referrers.length === 0) && (
                      <div className="text-xs text-stone-500 py-6 text-center">
                        Direct navigation / No referrers
                      </div>
                    )}
                  </div>
                </Panel>
              </div>

              {/* Status and Privacy Footer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-white/[0.08] bg-[#111614] p-4 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#18241e] text-emerald-400 border border-emerald-900/40">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-200">
                      Last updated
                    </div>
                    <div className="text-xs text-stone-400">
                      • {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                        timeZoneName: 'short',
                      }) : 'Just now'}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {stats?.isStale ? 'Showing cached statistics (live refresh delayed)' : 'Data updates automatically while panel is open'}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#111614] p-4 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#18241e] text-[#D5B16D] border border-[#2e4034]/60">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-200">
                      Privacy Protected Analytics
                    </div>
                    <div className="text-xs text-stone-400">
                      Visitor data is aggregated and privacy protected. Detailed visitor intelligence is strictly restricted to authenticated administrators.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RECENT VISITORS (ADMIN ONLY) */}
          {activeTab === 'visitors' && isAdmin && (
            <div className="space-y-6">
              {/* Search & Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={visitorSearch}
                    onChange={e => {
                      setVisitorSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by IP, location, page, device or referrer..."
                    className="w-full bg-[#111614] border border-white/[0.09] focus:border-[#D5B16D] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
                  />
                  {visitorSearch && (
                    <button
                      onClick={() => setVisitorSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={countryFilter}
                    onChange={e => {
                      setCountryFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by country"
                    className="bg-[#111614] border border-white/[0.09] text-xs text-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D5B16D]"
                  >
                    <option value="all">All Countries</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                  </select>

                  <select
                    value={deviceFilter}
                    onChange={e => {
                      setDeviceFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by device"
                    className="bg-[#111614] border border-white/[0.09] text-xs text-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D5B16D]"
                  >
                    <option value="all">All Devices</option>
                    <option value="mobile">Mobile</option>
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
              </div>

              {visitorsError && (
                <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/20 text-red-300 text-xs flex items-center justify-between">
                  <span>{visitorsError}</span>
                  <button
                    onClick={refetchVisitors}
                    className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Visitors Table */}
              <div className="rounded-xl border border-white/[0.09] bg-[#111614] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-[#161e1a] text-stone-400 font-semibold border-b border-white/[0.08]">
                      <tr>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Visitor</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Page</th>
                        <th className="py-3 px-4">Referrer</th>
                        <th className="py-3 px-4">Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {paginatedVisitors.map(v => {
                        const isSelected = selectedVisitor?.id === v.id;
                        const avatarHash = v.visitorId.slice(-6);
                        return (
                          <tr
                            key={v.id}
                            onClick={() => setSelectedVisitor(v)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#18241e] text-white'
                                : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-stone-400 font-mono">
                              {new Date(v.visitedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-900/80 border border-emerald-600/40 flex items-center justify-center text-[10px] text-emerald-300 font-bold">
                                  #{avatarHash.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="font-mono text-[#D5B16D]">#{avatarHash}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-stone-200">{v.location}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono text-stone-300">{v.page}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-stone-400">{v.referrer}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-stone-400">{v.device}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedVisitors.length === 0 && !visitorsLoading && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-stone-500">
                            No visitor sessions found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] bg-[#0E1210]/60 text-xs text-stone-400">
                  <div>
                    Showing {filteredVisitors.length > 0 ? (page - 1) * 10 + 1 : 0}–
                    {Math.min(page * 10, filteredVisitors.length)} of {filteredVisitors.length} visits
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-mono text-stone-300">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      aria-label="Next page"
                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Visitor Detail Inspector Panel */}
              {selectedVisitor && (
                <div className="rounded-xl border border-[#2e4235] bg-[#121915] p-5 shadow-xl relative animate-in fade-in-0 duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-sm font-bold text-emerald-400">
                        #{selectedVisitor.visitorId.slice(-4)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-100 font-mono">
                            #{selectedVisitor.visitorId.slice(-6)}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
                            {selectedVisitor.userId ? '• Authenticated Member' : '• Visitor Session'}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          Visited{' '}
                          {new Date(selectedVisitor.visitedAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedVisitor(null)}
                      aria-label="Close inspector panel"
                      className="text-stone-400 hover:text-white p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3-Column Inspector Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    {/* Col 1 */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-stone-500 block">Location</span>
                        <span className="text-stone-200 font-medium">
                          {selectedVisitor.location} (Approximate)
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">IP Address</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-stone-200">
                            {selectedVisitor.ipAddress || 'Unavailable'}
                          </span>
                          {selectedVisitor.ipAddress && selectedVisitor.ipAddress !== 'Unknown' && (
                            <button
                              onClick={() =>
                                handleCopyText(selectedVisitor.ipAddress!, 'IP Address', 'ip')
                              }
                              title="Copy IP"
                              className="text-stone-400 hover:text-[#D5B16D]"
                            >
                              {copiedKey === 'ip' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Referrer</span>
                        <span className="text-stone-200 truncate block">
                          {selectedVisitor.referrer}
                        </span>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-stone-500 block">Device</span>
                        <span className="text-stone-200 font-medium">
                          {selectedVisitor.device}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Browser</span>
                        <span className="text-stone-200 font-medium">
                          {selectedVisitor.browser}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Operating System</span>
                        <span className="text-stone-200 font-medium">{selectedVisitor.os}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Screen Resolution</span>
                        <span className="text-stone-200 font-mono">
                          {selectedVisitor.screenResolution || 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Col 3 */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-stone-500 block">Page Visited</span>
                        <span className="text-[#D5B16D] font-mono break-all block">
                          {selectedVisitor.page}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Language</span>
                        <span className="text-stone-200">{selectedVisitor.language}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Session ID</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-stone-300 truncate max-w-[160px]">
                            {selectedVisitor.sessionId || 'Unavailable'}
                          </span>
                          {selectedVisitor.sessionId && (
                            <button
                              onClick={() =>
                                handleCopyText(selectedVisitor.sessionId!, 'Session ID', 'sess')
                              }
                              title="Copy Session ID"
                              className="text-stone-400 hover:text-[#D5B16D]"
                            >
                              {copiedKey === 'sess' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Visitor ID</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-stone-300 truncate max-w-[160px]">
                            {selectedVisitor.visitorId}
                          </span>
                          <button
                            onClick={() =>
                              handleCopyText(selectedVisitor.visitorId, 'Visitor ID', 'vis')
                            }
                            title="Copy Visitor ID"
                            className="text-stone-400 hover:text-[#D5B16D]"
                          >
                            {copiedKey === 'vis' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSIGHTS & READING ENGAGEMENT */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4.5">
                  <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D] inline-block mb-3">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div className="text-2xl font-bold text-stone-100">
                    {number(stats?.readingEngagement?.bookViews ?? 0)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">Book Opens & Discovery</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Readers actively opening titles in the digital library
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4.5">
                  <span className="p-2 rounded-lg bg-[#18241e] text-emerald-400 inline-block mb-3">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div className="text-2xl font-bold text-stone-100">
                    {number(stats?.readingEngagement?.readingProgressUpdates ?? 0)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">Chapters Completed</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Verified reading room milestones
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4.5">
                  <span className="p-2 rounded-lg bg-[#18241e] text-sky-400 inline-block mb-3">
                    <Users className="w-4 h-4" />
                  </span>
                  <div className="text-2xl font-bold text-stone-100">
                    {number(stats?.readingEngagement?.discussions ?? 0)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">Community Discussions</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Thoughtful notes, comments & reflections
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4.5">
                  <span className="p-2 rounded-lg bg-[#18241e] text-amber-400 inline-block mb-3">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="text-2xl font-bold text-stone-100">
                    {number(stats?.readingEngagement?.groupJoins ?? 0)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">Reading Circles Joined</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    New collective reading memberships
                  </div>
                </div>
              </div>

              {/* Engagement Insights summary */}
              <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-5">
                <h4 className="text-sm font-semibold text-stone-100 mb-2 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-[#D5B16D]" />
                  Peak Reading & Quiet Hours
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
                  Sahadhyayi readers engage deeply during late evening quiet hours (8:00 PM – 11:30 PM IST). 
                  Unlike ephemeral feeds, readers on Sahadhyayi average longer session durations and return regularly to active reading rooms.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPulseDialog;

