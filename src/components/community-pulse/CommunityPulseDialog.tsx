import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Info,
  Trophy,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  PulseStats,
  RecentVisitor,
  Change,
  HourPoint,
  useCommunityPulse,
  getBaselineStats,
  buildEmptyHourlyBuckets,
} from '@/hooks/useCommunityPulse';
import { useToast } from '@/hooks/use-toast';

export type CommunityPulseDialogProps = {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  stats?: PulseStats | null;
  visitors?: RecentVisitor[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onVisitorSearch?: (query: string) => void;
  pulseState?: ReturnType<typeof useCommunityPulse>;
};

const formatMetric = (value: number | null | undefined, prefix = '', fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  return `${prefix}${new Intl.NumberFormat().format(value)}`;
};

const number = (value: number | null | undefined) => formatMetric(value);

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
    <section className={`rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4.5 min-w-0 overflow-hidden ${className}`}>
      <div className="mb-3.5 flex items-center justify-between gap-3 min-w-0">
        <h3 className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-semibold text-stone-100 truncate">
          <span className="text-[#D5B16D] flex-shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </h3>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export const CommunityPulseDialog: React.FC<CommunityPulseDialogProps> = ({
  open,
  onClose,
  isAdmin: propIsAdmin,
  stats: propStats,
  visitors: propVisitors,
  loading: propLoading,
  error: propError,
  onRefresh: propOnRefresh,
  onVisitorSearch: propOnVisitorSearch,
  pulseState: externalPulseState,
}) => {
  const internalPulseState = useCommunityPulse(open);
  const pulse = externalPulseState || internalPulseState;

  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : pulse.isAdmin;
  const stats = propStats !== undefined ? propStats : pulse.stats;
  const visitors = propVisitors !== undefined ? propVisitors : pulse.visitors;
  const loading = propLoading !== undefined ? propLoading : pulse.loading;
  const error = propError !== undefined ? propError : pulse.error;

  const {
    timeframe,
    setTimeframe,
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [showAllReferrers, setShowAllReferrers] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Close on Escape & Lock body scroll
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

  // Authoritative metrics computation: measured zero stays zero, missing data stays unavailable
  const effectiveStats: PulseStats = React.useMemo(() => {
    if (stats) {
      return {
        pageViews: typeof stats.pageViews === 'number' ? stats.pageViews : null,
        uniqueVisitors: typeof stats.uniqueVisitors === 'number' ? stats.uniqueVisitors : null,
        newReaders: typeof stats.newReaders === 'number' ? stats.newReaders : null,
        totalMembers: typeof stats.totalMembers === 'number' ? stats.totalMembers : null,
        avgTimeOnSite: stats.avgTimeOnSite || '—',
        pageViewsChange: stats.pageViewsChange,
        uniqueVisitorsChange: stats.uniqueVisitorsChange,
        newReadersChange: stats.newReadersChange,
        avgTimeChange: stats.avgTimeChange,
        hourlyActivity: Array.isArray(stats.hourlyActivity) && stats.hourlyActivity.length > 0
          ? stats.hourlyActivity
          : [],
        countries: Array.isArray(stats.countries) ? stats.countries : [],
        topPages: Array.isArray(stats.topPages) ? stats.topPages : [],
        devices: Array.isArray(stats.devices) ? stats.devices : [],
        referrers: Array.isArray(stats.referrers) ? stats.referrers : [],
        readingEngagement: stats.readingEngagement ?? {
          bookViews: null,
          readingProgressUpdates: null,
          groupJoins: null,
          discussions: null,
        },
        topMembers: Array.isArray(stats.topMembers) ? stats.topMembers : [],
        lastUpdated: stats.lastUpdated || '',
        isStale: stats.isStale ?? false,
        partialData: stats.partialData ?? false,
      };
    }
    return getBaselineStats(timeframe);
  }, [stats, timeframe]);

  // Hourly chart data scaled appropriately for views vs unique visitors without artificial minimums
  const hourlyData = React.useMemo(() => {
    const raw = effectiveStats.hourlyActivity || [];
    return raw.map(h => {
      if (metricView === 'unique') {
        const pageViewsNum = effectiveStats.pageViews ?? 0;
        const uniqueNum = effectiveStats.uniqueVisitors ?? 0;
        const ratio = pageViewsNum > 0
          ? Math.min(1, uniqueNum / pageViewsNum)
          : 0;
        const count = Math.round(h.count * ratio);
        return { ...h, count };
      }
      return h;
    });
  }, [effectiveStats.hourlyActivity, effectiveStats.pageViews, effectiveStats.uniqueVisitors, metricView]);

  const maxHourlyCount = Math.max(0, ...hourlyData.map(h => h.count));
  const chartPeak = maxHourlyCount > 0 ? Math.ceil(maxHourlyCount / 10) * 10 : 10;

  if (!open) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in-0 duration-200 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-auto max-h-[92dvh] sm:max-h-[88vh] my-auto rounded-2xl border border-white/[0.09] bg-[#0B0D0C] text-stone-100 shadow-2xl overflow-hidden min-w-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-white/[0.08] bg-[#0E1210]/95 flex-shrink-0 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#16201b] border border-[#27392f] flex items-center justify-center text-[#D5B16D] shadow-inner flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="pulse-modal-title" className="text-sm sm:text-lg font-bold text-stone-100 tracking-tight truncate">
                  Live Website Stats
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex-shrink-0" title="Auto-updates every 60 seconds">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
                {effectiveStats.isStale && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40 flex-shrink-0">
                    Cached
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAbout(prev => !prev)}
                  className="text-stone-400 hover:text-[#D5B16D] text-[11px] flex items-center gap-1 ml-1"
                  title="About these metrics & data definitions"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">About</span>
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 truncate mt-0.5">
                Real-time traffic, visitor analytics & reading activity across our {effectiveStats.totalMembers !== null ? `${number(effectiveStats.totalMembers)}-reader` : 'reader'} community
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsible About Metrics Explainer */}
        {showAbout && (
          <div className="px-4 sm:px-6 py-3.5 bg-[#141b17] border-b border-white/[0.08] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-100 flex items-center gap-1.5 text-xs sm:text-sm">
                <Info className="w-4 h-4 text-[#D5B16D]" />
                About these numbers & data integrity
              </h3>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="text-stone-400 hover:text-white text-[11px]"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-stone-300 pt-0.5 text-[11px] leading-relaxed">
              <div>
                <strong className="text-stone-100">Page views:</strong> Authoritative count of confirmed pageview events (event_type = 'pageview'). Excludes non-pageview internal signals.
              </div>
              <div>
                <strong className="text-stone-100">Unique visitors:</strong> Distinct visitors tracked via persistent visitor ID with fallback to session ID for the selected timeframe.
              </div>
              <div>
                <strong className="text-stone-100">Registered readers:</strong> Authoritative member accounts directly counted from user records.
              </div>
              <div>
                <strong className="text-stone-100">Average duration:</strong> Reported as unavailable (—) until active client in-tab duration telemetry is deployed.
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/[0.08] bg-[#0B0D0C] flex-shrink-0 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111614] border border-white/[0.06] overflow-x-auto max-w-full no-scrollbar flex-shrink min-w-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Overview</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('visitors')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'visitors'
                    ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Recent Visitors</span>
                <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-[#D5B16D]/15 text-[#D5B16D] font-bold">
                  Admin
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Insights</span>
            </button>
          </div>

          {/* Controls: Timeframe & Refresh */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <div className="relative">
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value as '24h' | '7d' | '30d')}
                aria-label="Select timeframe"
                className="appearance-none bg-[#111614] border border-white/[0.09] hover:border-white/20 text-stone-200 text-xs rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D5B16D] cursor-pointer"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                if (propOnRefresh) {
                  propOnRefresh();
                } else if (activeTab === 'visitors') {
                  refetchVisitors();
                } else {
                  refetchStats();
                }
              }}
              disabled={loading || visitorsLoading}
              title="Refresh metrics"
              aria-label="Refresh metrics"
              className="p-1.5 sm:p-2 rounded-lg bg-[#111614] border border-white/[0.09] hover:border-white/20 text-stone-300 hover:text-[#D5B16D] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading || visitorsLoading ? 'animate-spin text-[#D5B16D]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Error Alert State (when no stats exist and error occurs) */}
              {error && !stats && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 p-4 sm:p-5 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-rose-400 font-semibold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Unable to load live community statistics</span>
                  </div>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (propOnRefresh) propOnRefresh();
                      else refetchStats();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18241e] border border-white/10 hover:border-white/20 text-xs text-stone-200 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Stale Warning Banner (when refresh fails but cached stats are preserved) */}
              {error && stats?.isStale && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs flex items-center justify-between gap-3 text-amber-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="truncate">
                      Live refresh delayed ({error}). Showing cached metrics from {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'previous session'}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (propOnRefresh) propOnRefresh();
                      else refetchStats();
                    }}
                    className="text-[11px] underline hover:text-white flex-shrink-0 font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {effectiveStats.partialData && (
                <div
                  role="status"
                  className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-3.5 py-3 text-xs leading-relaxed text-amber-200"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <div>
                      <p className="font-semibold">Some analytics details are unavailable</p>
                      <p className="mt-1 text-amber-100/75">
                        The backend returned partial statistics. Missing breakdowns are not treated as zero activity. Refresh again after the analytics backend is restored.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 min-w-0">
                {/* 1. Page Views */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    {effectiveStats.pageViewsChange?.value != null && (
                      <span className={`text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-0.5 flex-shrink-0 ${
                        effectiveStats.pageViewsChange.value >= 0
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/30'
                          : 'text-rose-400 bg-rose-950/60 border-rose-800/30'
                      }`}>
                        {effectiveStats.pageViewsChange.value >= 0 ? '↑' : '↓'} {changeLabel(effectiveStats.pageViewsChange)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                      {number(effectiveStats.pageViews)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Page views</div>
                    <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                      {effectiveStats.pageViewsChange?.label || 'vs previous period'}
                    </div>
                  </div>
                </div>

                {/* 2. Unique Visitors */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    {effectiveStats.uniqueVisitorsChange?.value != null && (
                      <span className={`text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-0.5 flex-shrink-0 ${
                        effectiveStats.uniqueVisitorsChange.value >= 0
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/30'
                          : 'text-rose-400 bg-rose-950/60 border-rose-800/30'
                      }`}>
                        {effectiveStats.uniqueVisitorsChange.value >= 0 ? '↑' : '↓'} {changeLabel(effectiveStats.uniqueVisitorsChange)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                      {number(effectiveStats.uniqueVisitors)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Unique visitors</div>
                    <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                      {effectiveStats.uniqueVisitorsChange?.label || 'vs previous period'}
                    </div>
                  </div>
                </div>

                {/* 3. New Readers & Community Size */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#D5B16D] bg-[#D5B16D]/10 px-2 py-0.5 rounded-full border border-[#D5B16D]/20 flex items-center gap-1 flex-shrink-0">
                      <Users className="w-3 h-3" />
                      {effectiveStats.totalMembers !== null ? `${number(effectiveStats.totalMembers)} Total` : '—'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                      {effectiveStats.newReaders !== null ? `+${number(effectiveStats.newReaders)}` : '—'}
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">New readers</div>
                    <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                      {effectiveStats.totalMembers !== null ? `${number(effectiveStats.totalMembers)} total registered readers` : 'Registered readers'}
                    </div>
                  </div>
                </div>

                {/* 4. Avg. Time on Site */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                      <Clock3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    {effectiveStats.avgTimeChange?.value != null && (
                      <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-800/30 flex items-center gap-0.5 flex-shrink-0">
                        {effectiveStats.avgTimeChange.value >= 0 ? '↑' : '↓'} {changeLabel(effectiveStats.avgTimeChange)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                      {effectiveStats.avgTimeOnSite || '—'}
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Avg. time on site</div>
                    <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                      {effectiveStats.avgTimeOnSite !== '—' ? 'vs previous period' : 'Telemetry unavailable'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Visitor Activity Chart (Left) + Visitors by Country (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                {/* Hourly Visitor Activity */}
                <div className="lg:col-span-2 min-w-0">
                  <Panel
                    title="Visitor Activity"
                    icon={<Eye className="w-4 h-4" />}
                    action={
                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <span className="hidden sm:inline">Metric:</span>
                        <select
                          aria-label="Select metric"
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
                    <div className="h-44 sm:h-48 pt-3 pb-2 flex flex-col justify-end w-full min-w-0">
                      <div className="flex items-end justify-between gap-1 h-32 sm:h-36 border-b border-white/[0.08] pb-1 px-1 w-full min-w-0 overflow-x-auto sm:overflow-x-visible">
                        {maxHourlyCount > 0 ? (
                          hourlyData.map((h, i) => {
                            const heightPct = Math.max(6, Math.min(100, Math.round((h.count / chartPeak) * 100)));
                            const isPeak = h.isPeak;
                            return (
                              <div
                                key={i}
                                className="group relative flex-1 flex flex-col items-center justify-end h-full min-w-[8px] sm:min-w-0"
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                                  <div className="bg-[#18241e] text-stone-100 text-[10px] py-1 px-2 rounded border border-white/10 shadow-lg whitespace-nowrap">
                                    <div className="font-semibold">{h.label}</div>
                                    <div className="text-[#D5B16D]">{h.count} {metricView === 'unique' ? 'visitors' : 'views'}</div>
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
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-stone-500 py-6 gap-1.5">
                            <Activity className="w-5 h-5 text-stone-600 animate-pulse" />
                            <span>No pageviews recorded in this timeframe yet</span>
                            <span className="text-[10px] text-stone-600">Hourly activity will appear here as readers browse</span>
                          </div>
                        )}
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-between text-[9px] sm:text-[10px] text-stone-500 pt-2 px-1 w-full">
                        <span>12AM</span>
                        <span className="hidden sm:inline">3AM</span>
                        <span>6AM</span>
                        <span className="hidden sm:inline">9AM</span>
                        <span>12PM</span>
                        <span className="hidden sm:inline">3PM</span>
                        <span>6PM</span>
                        <span>9PM</span>
                      </div>
                    </div>
                  </Panel>
                </div>

                {/* Visitors by Country */}
                <div className="lg:col-span-1 min-w-0">
                  <Panel
                    title="Visitors by Country"
                    icon={<Globe2 className="w-4 h-4" />}
                    action={
                      effectiveStats.countries.length > 5 && (
                        <button
                          onClick={() => setShowAllCountries(!showAllCountries)}
                          className="text-xs text-[#D5B16D] hover:underline"
                        >
                          {showAllCountries ? 'Show less' : 'View all >'}
                        </button>
                      )
                    }
                  >
                    <div className="space-y-3 pt-1 min-w-0">
                      {effectiveStats.countries.slice(0, showAllCountries ? 15 : 6).map((c, i) => (
                        <div key={i} className="flex items-center gap-2.5 sm:gap-3 text-xs min-w-0">
                          <span className="text-sm sm:text-base select-none flex-shrink-0">{getFlagEmoji(c.code)}</span>
                          <span className="w-20 sm:w-24 truncate text-stone-300 font-medium">
                            {formatCountryName(c.name)}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[40px]">
                            <div
                              style={{ width: `${Math.min(100, Math.max(3, c.percent))}%` }}
                              className="h-full bg-[#D5B16D] rounded-full transition-all duration-500"
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-stone-400 flex-shrink-0">
                            {c.percent}%
                          </span>
                        </div>
                      ))}

                      {effectiveStats.countries.length === 0 && (
                        <div className="text-xs text-stone-500 py-6 text-center">
                          No country geolocation data recorded yet
                        </div>
                      )}
                    </div>
                  </Panel>
                </div>
              </div>

              {/* Third Row: Top Pages, Devices, Referrers (3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                {/* 1. Top Pages */}
                <Panel
                  title="Top Pages"
                  icon={<BookOpen className="w-4 h-4" />}
                  action={
                    effectiveStats.topPages.length > 5 && (
                      <button
                        onClick={() => setShowAllPages(!showAllPages)}
                        className="text-xs text-[#D5B16D] hover:underline"
                      >
                        {showAllPages ? 'Show less' : 'View all >'}
                      </button>
                    )
                  }
                >
                  <div className="space-y-3 pt-1 min-w-0">
                    {effectiveStats.topPages.slice(0, showAllPages ? 10 : 5).map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 sm:gap-3 text-xs min-w-0">
                        <span className="w-24 sm:w-28 truncate font-mono text-stone-300" title={p.name}>
                          {p.name}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[40px]">
                          <div
                            style={{ width: `${Math.min(100, Math.max(4, p.percent))}%` }}
                            className="h-full bg-[#D5B16D] rounded-full transition-all"
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-stone-400 flex-shrink-0">
                          {p.percent}%
                        </span>
                      </div>
                    ))}
                    {effectiveStats.topPages.length === 0 && (
                      <div className="text-xs text-stone-500 py-6 text-center">
                        No page activity records found
                      </div>
                    )}
                  </div>
                </Panel>

                {/* 2. Devices */}
                <Panel title="Devices" icon={<Laptop className="w-4 h-4" />}>
                  <div className="space-y-3 pt-1 min-w-0">
                    {effectiveStats.devices.map((d, i) => {
                      const dt = d.name.toLowerCase();
                      const Icon = dt.includes('mobile')
                        ? Smartphone
                        : dt.includes('tablet')
                        ? Tablet
                        : Monitor;
                      return (
                        <div key={i} className="flex items-center gap-2.5 sm:gap-3 text-xs min-w-0">
                          <Icon className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          <span className="w-18 sm:w-20 truncate text-stone-300 font-medium capitalize">
                            {d.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[40px]">
                            <div
                              style={{ width: `${Math.min(100, Math.max(4, d.percent))}%` }}
                              className="h-full bg-[#D5B16D] rounded-full transition-all"
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-stone-400 flex-shrink-0">
                            {d.percent}%
                          </span>
                        </div>
                      );
                    })}
                    {effectiveStats.devices.length === 0 && (
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
                    effectiveStats.referrers.length > 5 && (
                      <button
                        onClick={() => setShowAllReferrers(!showAllReferrers)}
                        className="text-xs text-[#D5B16D] hover:underline"
                      >
                        {showAllReferrers ? 'Show less' : 'View all >'}
                      </button>
                    )
                  }
                >
                  <div className="space-y-3 pt-1 min-w-0">
                    {effectiveStats.referrers.slice(0, showAllReferrers ? 10 : 5).map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5 sm:gap-3 text-xs min-w-0">
                        <span className="w-20 sm:w-24 truncate text-stone-300 font-medium">
                          {r.name}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[40px]">
                          <div
                            style={{ width: `${Math.min(100, Math.max(4, r.percent))}%` }}
                            className="h-full bg-[#D5B16D] rounded-full transition-all"
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-stone-400 flex-shrink-0">
                          {r.percent}%
                        </span>
                      </div>
                    ))}
                    {effectiveStats.referrers.length === 0 && (
                      <div className="text-xs text-stone-500 py-6 text-center">
                        Direct navigation / No referrers
                      </div>
                    )}
                  </div>
                </Panel>
              </div>

              {/* Status and Privacy Footer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1 min-w-0">
                <div className="rounded-xl border border-white/[0.08] bg-[#111614] p-3.5 sm:p-4 flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-[#18241e] text-emerald-400 border border-emerald-900/40 flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-200 truncate">
                      Last updated
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 truncate">
                      • {effectiveStats.lastUpdated ? new Date(effectiveStats.lastUpdated).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                        timeZoneName: 'short',
                      }) : 'Just now'}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 truncate">
                      {effectiveStats.isStale ? 'Showing cached statistics (live refresh delayed)' : 'Data updates automatically while panel is open'}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#111614] p-3.5 sm:p-4 flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-[#18241e] text-[#D5B16D] border border-[#2e4034]/60 flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-200 truncate">
                      Privacy Protected Analytics
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 leading-snug">
                      Visitor data is aggregated and privacy protected. Detailed visitor intelligence is strictly restricted to authenticated administrators.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RECENT VISITORS (ADMIN ONLY) */}
          {activeTab === 'visitors' && isAdmin && (
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Search & Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={visitorSearch}
                    onChange={e => {
                      if (propOnVisitorSearch) propOnVisitorSearch(e.target.value);
                      setVisitorSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by IP, location, page, device or referrer..."
                    className="w-full bg-[#111614] border border-white/[0.09] focus:border-[#D5B16D] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
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

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <select
                    value={countryFilter}
                    onChange={e => {
                      setCountryFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by country"
                    className="bg-[#111614] border border-white/[0.09] text-xs text-stone-300 rounded-xl px-2.5 sm:px-3 py-2 focus:outline-none focus:border-[#D5B16D]"
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
                    className="bg-[#111614] border border-white/[0.09] text-xs text-stone-300 rounded-xl px-2.5 sm:px-3 py-2 focus:outline-none focus:border-[#D5B16D]"
                  >
                    <option value="all">All Devices</option>
                    <option value="mobile">Mobile</option>
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
              </div>

              {visitorsError && (
                <div className="p-3 sm:p-4 rounded-xl border border-red-900/50 bg-red-950/20 text-red-300 text-xs flex items-center justify-between">
                  <span>{visitorsError}</span>
                  <button
                    onClick={refetchVisitors}
                    className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Visitors Table Container (Horizontally Scrollable, Never Out of Bounds) */}
              <div className="rounded-xl border border-white/[0.09] bg-[#111614] overflow-hidden min-w-0 w-full max-w-full">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-left text-xs text-stone-300 min-w-[550px]">
                    <thead className="bg-[#161e1a] text-stone-400 font-semibold border-b border-white/[0.08]">
                      <tr>
                        <th className="py-3 px-3 sm:px-4">Time</th>
                        <th className="py-3 px-3 sm:px-4">Visitor</th>
                        <th className="py-3 px-3 sm:px-4">Location</th>
                        <th className="py-3 px-3 sm:px-4">Page</th>
                        <th className="py-3 px-3 sm:px-4">Referrer</th>
                        <th className="py-3 px-3 sm:px-4">Device</th>
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
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-stone-400 font-mono">
                              {new Date(v.visitedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-900/80 border border-emerald-600/40 flex items-center justify-center text-[10px] text-emerald-300 font-bold">
                                  #{avatarHash.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="font-mono text-[#D5B16D]">#{avatarHash}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <span className="text-stone-200">{v.location}</span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <span className="font-mono text-stone-300">{v.page}</span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <span className="text-stone-400 truncate max-w-[140px] block">{v.referrer}</span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] bg-[#0E1210]/60 text-xs text-stone-400 min-w-0">
                  <div className="truncate">
                    Showing {filteredVisitors.length > 0 ? (page - 1) * 10 + 1 : 0}–
                    {Math.min(page * 10, filteredVisitors.length)} of {filteredVisitors.length} visits
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="p-1 sm:p-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-1.5 sm:px-2 font-mono text-stone-300 text-xs">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      aria-label="Next page"
                      className="p-1 sm:p-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Visitor Detail Inspector Panel */}
              {selectedVisitor && (
                <div className="rounded-xl border border-[#2e4235] bg-[#121915] p-4 sm:p-5 shadow-xl relative animate-in fade-in-0 duration-150 min-w-0 w-full">
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-xs sm:text-sm font-bold text-emerald-400 flex-shrink-0">
                        #{selectedVisitor.visitorId.slice(-4)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-stone-100 font-mono">
                            #{selectedVisitor.visitorId.slice(-6)}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
                            {selectedVisitor.userId ? '• Authenticated Member' : '• Visitor Session'}
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">
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
                      className="text-stone-400 hover:text-white p-1 rounded flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3-Column Inspector Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs min-w-0">
                    {/* Col 1 */}
                    <div className="space-y-3 min-w-0">
                      <div>
                        <span className="text-stone-500 block">Location</span>
                        <span className="text-stone-200 font-medium truncate block">
                          {selectedVisitor.location} (Approximate)
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">IP Address</span>
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          <span className="font-mono text-stone-200 truncate">
                            {selectedVisitor.ipAddress || 'Unavailable'}
                          </span>
                          {selectedVisitor.ipAddress && selectedVisitor.ipAddress !== 'Unknown' && (
                            <button
                              onClick={() =>
                                handleCopyText(selectedVisitor.ipAddress!, 'IP Address', 'ip')
                              }
                              title="Copy IP"
                              className="text-stone-400 hover:text-[#D5B16D] flex-shrink-0"
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
                        <span className="text-stone-200 truncate block break-all">
                          {selectedVisitor.referrer}
                        </span>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-3 min-w-0">
                      <div>
                        <span className="text-stone-500 block">Device</span>
                        <span className="text-stone-200 font-medium truncate block">
                          {selectedVisitor.device}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Browser</span>
                        <span className="text-stone-200 font-medium truncate block">
                          {selectedVisitor.browser}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Operating System</span>
                        <span className="text-stone-200 font-medium truncate block">{selectedVisitor.os}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Screen Resolution</span>
                        <span className="text-stone-200 font-mono truncate block">
                          {selectedVisitor.screenResolution || 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Col 3 */}
                    <div className="space-y-3 min-w-0">
                      <div>
                        <span className="text-stone-500 block">Page Visited</span>
                        <span className="text-[#D5B16D] font-mono break-all block truncate">
                          {selectedVisitor.page}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Language</span>
                        <span className="text-stone-200 truncate block">{selectedVisitor.language}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Session ID</span>
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          <span className="font-mono text-stone-300 truncate max-w-[150px] block">
                            {selectedVisitor.sessionId || 'Unavailable'}
                          </span>
                          {selectedVisitor.sessionId && (
                            <button
                              onClick={() =>
                                handleCopyText(selectedVisitor.sessionId!, 'Session ID', 'sess')
                              }
                              title="Copy Session ID"
                              className="text-stone-400 hover:text-[#D5B16D] flex-shrink-0"
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
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          <span className="font-mono text-stone-300 truncate max-w-[150px] block">
                            {selectedVisitor.visitorId}
                          </span>
                          <button
                            onClick={() =>
                              handleCopyText(selectedVisitor.visitorId, 'Visitor ID', 'vis')
                            }
                            title="Copy Visitor ID"
                            className="text-stone-400 hover:text-[#D5B16D] flex-shrink-0"
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
            <div className="space-y-4 sm:space-y-6 min-w-0">
              {/* Community Reader Base Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-white/[0.09] bg-[#111614] min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#18241e] border border-[#2e4034]/60 flex items-center justify-center text-[#D5B16D] flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-bold text-stone-100 truncate">
                      {effectiveStats.totalMembers ? `${number(effectiveStats.totalMembers)} Total Readers` : 'Total Readers'}
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-400 truncate mt-0.5">
                      Global reading community growing with +{number(effectiveStats.newReaders)} new readers this period
                    </div>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40 flex-shrink-0">
                  Verified Reader Network
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4.5 min-w-0">
                  <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D] inline-block mb-3">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-stone-100 truncate">
                    {number(effectiveStats.readingEngagement?.bookViews)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1 truncate">Book Opens & Discovery</div>
                  <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                    Readers actively opening titles in the digital library
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4.5 min-w-0">
                  <span className="p-2 rounded-lg bg-[#18241e] text-emerald-400 inline-block mb-3">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-stone-100 truncate">
                    {number(effectiveStats.readingEngagement?.readingProgressUpdates)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1 truncate">Chapters Completed</div>
                  <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                    Verified reading room milestones
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4.5 min-w-0">
                  <span className="p-2 rounded-lg bg-[#18241e] text-sky-400 inline-block mb-3">
                    <Users className="w-4 h-4" />
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-stone-100 truncate">
                    {number(effectiveStats.readingEngagement?.discussions)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1 truncate">Community Discussions</div>
                  <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                    Thoughtful notes, comments & reflections
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4.5 min-w-0">
                  <span className="p-2 rounded-lg bg-[#18241e] text-amber-400 inline-block mb-3">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-stone-100 truncate">
                    {number(effectiveStats.readingEngagement?.groupJoins)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1 truncate">Reading Circles Joined</div>
                  <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                    New collective reading memberships
                  </div>
                </div>
              </div>

              {/* Contributor Leaderboard Panel */}
              <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 sm:p-5 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#D5B16D] flex-shrink-0" />
                    <span>Top Community Contributors ({timeframe})</span>
                  </h4>
                  <span className="text-[10px] text-stone-400">Activity points: posts (5), chapters (4), comments (3), messages (2)</span>
                </div>
                {effectiveStats.topMembers && effectiveStats.topMembers.length > 0 ? (
                  <div className="space-y-2">
                    {effectiveStats.topMembers.map((member) => (
                      <div
                        key={member.userId || member.rank}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#18241e]/60 border border-white/[0.04]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 text-center text-xs font-bold ${
                            member.rank === 1 ? 'text-amber-400' : member.rank === 2 ? 'text-stone-300' : member.rank === 3 ? 'text-amber-600' : 'text-stone-500'
                          }`}>
                            #{member.rank}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-stone-700 overflow-hidden flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              (member.name || 'R').slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-200 truncate">{member.name}</p>
                            {member.username && <p className="text-[10px] text-stone-400 truncate">@{member.username}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="text-xs font-bold text-[#D5B16D]">{member.totalPoints} pts</span>
                          <p className="text-[10px] text-stone-400">{member.activityCount} actions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-stone-500">
                    No qualifying community contributions recorded in this timeframe
                  </div>
                )}
              </div>

              {/* Engagement Insights summary */}
              <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 sm:p-5 min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-stone-100 mb-2 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-[#D5B16D] flex-shrink-0" />
                  <span>Peak Reading & Quiet Hours</span>
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
                  Sahadhyayi readers engage deeply during evening quiet hours (8:00 PM – 11:30 PM IST). 
                  Unlike ephemeral feeds, readers on Sahadhyayi focus on long-form literature, chapter completions, and reading room discussions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default CommunityPulseDialog;
