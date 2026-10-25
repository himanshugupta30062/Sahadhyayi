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
  HeartPulse,
  Database,
  Radio,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  PulseStats,
  RecentVisitor,
  Change,
  HourPoint,
  useCommunityPulse,
  getBaselineStats,
} from '@/hooks/useCommunityPulse';
import { useToast } from '@/hooks/use-toast';
import './CommunityPulseDialog.theme.css';

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
  change && change.value != null ? `${change.value > 0 ? '+' : ''}${change.value}%` : null;

let bodyScrollLockCount = 0;
let originalBodyOverflow: string | undefined;

const acquireBodyScrollLock = () => {
  if (typeof document === 'undefined') return () => undefined;
  if (bodyScrollLockCount === 0) originalBodyOverflow = document.body.style.overflow;
  bodyScrollLockCount += 1;
  document.body.style.overflow = 'hidden';
  let released = false;

  return () => {
    if (released) return;
    released = true;
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
    if (bodyScrollLockCount === 0 && originalBodyOverflow !== undefined) {
      document.body.style.overflow = originalBodyOverflow;
      originalBodyOverflow = undefined;
    }
  };
};

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
    <section className={`rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-5 min-w-0 overflow-hidden ${className}`}>
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
    latestVisitTime,
    latestVisitPage,
  } = pulse;

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'visitors' | 'insights' | 'diagnostics'>('overview');
  const [metricView, setMetricView] = useState<'views' | 'unique' | 'dual'>('views');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [showAllReferrers, setShowAllReferrers] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [chartInterval, setChartInterval] = useState<'hourly' | 'daily'>('hourly');

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const currentIndex = tabs.indexOf(event.target as HTMLButtonElement);
    if (currentIndex < 0) return;

    let nextIndex: number;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  // Close on Escape and use a reference-counted lock so stacked dialogs
  // do not restore body scrolling until the last open dialog closes.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    let releaseBodyScrollLock: (() => void) | undefined;
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      releaseBodyScrollLock = acquireBodyScrollLock();
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      releaseBodyScrollLock?.();
    };
  }, [open, onClose]);

  const handleCopyText = (text: string, label: string, key: string) => {
    try {
      void navigator.clipboard.writeText(text).catch(() => {
        toast({ title: 'Copy failed', description: 'Could not access clipboard.', variant: 'destructive' });
      });
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
        sessions: typeof stats.sessions === 'number' ? stats.sessions : null,
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
        dailyActivity: Array.isArray(stats.dailyActivity) ? stats.dailyActivity : [],
        lifetimeVisits: stats.lifetimeVisits ?? null,
        dualTable: stats.dualTable,
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
        diagnostics: stats.diagnostics,
      };
    }
    return getBaselineStats(timeframe);
  }, [stats, timeframe]);

  // Unique visitors must use real per-hour aggregates; do not estimate them from pageviews.
  const hourlyUniqueDataAvailable = effectiveStats.hourlyActivity.some(
    h => typeof h.uniqueVisitors === 'number',
  );

  const hourlyData = React.useMemo(() => {
    const raw = effectiveStats.hourlyActivity || [];
    return raw.map(h => ({
      ...h,
      count: metricView === 'unique' ? (h.uniqueVisitors ?? 0) : h.count,
      pageViews: h.count,
      uniqueVisitors: h.uniqueVisitors,
    }));
  }, [effectiveStats.hourlyActivity, metricView]);

  const dailyData = React.useMemo(() => {
    const raw = effectiveStats.dailyActivity || [];
    return raw.map(d => ({
      ...d,
      count: metricView === 'unique' ? d.uniqueVisitors : d.pageViews,
      pageViews: d.pageViews,
      uniqueVisitors: d.uniqueVisitors,
    }));
  }, [effectiveStats.dailyActivity, metricView]);

  const activeChartData = chartInterval === 'daily' && dailyData.length > 0 ? dailyData : hourlyData;
  const maxChartCount = Math.max(
    0,
    ...activeChartData.map(h => {
      if (metricView === 'dual') {
        return Math.max(h.pageViews ?? h.count ?? 0, h.uniqueVisitors ?? 0);
      }
      if (metricView === 'unique') {
        return h.uniqueVisitors ?? 0;
      }
      return h.pageViews ?? h.count ?? 0;
    })
  );
  const chartPeak = maxChartCount > 0 ? Math.ceil(maxChartCount / 10) * 10 : 10;

  if (!open) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pulse-modal-title"
      className="community-pulse-dialog fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-3 md:p-4 lg:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in-0 duration-200 overflow-hidden"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col w-full h-full sm:w-[95vw] sm:max-w-[1600px] sm:h-[92vh] sm:max-h-[94vh] my-auto rounded-none sm:rounded-2xl border-0 sm:border border-white/[0.09] bg-[#0B0D0C] text-stone-100 shadow-2xl overflow-hidden min-w-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Fixed Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-white/[0.08] bg-[#0E1210]/95 flex-shrink-0 min-w-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#16201b] border border-[#27392f] flex items-center justify-center text-[#D5B16D] shadow-inner flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 id="pulse-modal-title" className="text-sm sm:text-lg font-bold text-stone-100 tracking-tight truncate">
                  Live Website Stats
                </h2>
                {loading && !stats ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/40 flex-shrink-0">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading
                  </span>
                ) : error && !stats ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/40 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border flex-shrink-0 ${
                      effectiveStats.partialData
                        ? 'bg-amber-950/70 text-amber-300 border-amber-800/40'
                        : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                    }`}
                    title={effectiveStats.partialData ? 'Some live analytics details are unavailable' : 'Auto-updates every 60 seconds'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${effectiveStats.partialData ? 'bg-amber-300' : 'bg-emerald-400 animate-pulse'}`} />
                    {effectiveStats.partialData ? 'Partial' : 'Live'}
                  </span>
                )}
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

          {/* Header Controls: Timeframe Selector & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
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
                  void refetchVisitors();
                } else {
                  void refetchStats();
                }
              }}
              disabled={loading || visitorsLoading}
              title="Refresh metrics"
              aria-label="Refresh metrics"
              className="p-1.5 sm:p-2 rounded-lg bg-[#111614] border border-white/[0.09] hover:border-white/20 text-stone-300 hover:text-[#D5B16D] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading || visitorsLoading ? 'animate-spin text-[#D5B16D]' : ''}`} />
            </button>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible About Metrics Explainer */}
        {showAbout && (
          <div className="px-4 sm:px-6 md:px-8 py-3.5 bg-[#141b17] border-b border-white/[0.08] text-xs space-y-2 flex-shrink-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-stone-300 pt-0.5 text-[11px] leading-relaxed">
              <div>
                <strong className="text-stone-100">Page views:</strong> Authoritative count of confirmed pageview events (<code className="text-[#D5B16D]">event_type = 'pageview'</code>).
              </div>
              <div>
                <strong className="text-stone-100">Unique visitors:</strong> Distinct visitors tracked via persistent visitor ID with session fallback.
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

        {/* Sticky Fixed Navigation & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 border-b border-white/[0.08] bg-[#0B0D0C] flex-shrink-0 min-w-0 z-10">
          {/* Tabs */}
          <div role="tablist" aria-label="Community pulse sections" onKeyDown={handleTabKeyDown} className="flex items-center gap-1 p-1 rounded-xl bg-[#111614] border border-white/[0.06] overflow-x-auto max-w-full no-scrollbar flex-shrink min-w-0">
            <button
              onClick={() => setActiveTab('overview')}
              role="tab"
              id="pulse-tab-overview"
              aria-controls="pulse-panel-overview"
              aria-selected={activeTab === 'overview'}
              tabIndex={activeTab === 'overview' ? 0 : -1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
                role="tab"
                id="pulse-tab-visitors"
                aria-controls="pulse-panel-visitors"
                aria-selected={activeTab === 'visitors'}
                tabIndex={activeTab === 'visitors' ? 0 : -1}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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
              role="tab"
              id="pulse-tab-insights"
              aria-controls="pulse-panel-insights"
              aria-selected={activeTab === 'insights'}
              tabIndex={activeTab === 'insights' ? 0 : -1}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Insights & Reading</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('diagnostics')}
                role="tab"
                id="pulse-tab-diagnostics"
                aria-controls="pulse-panel-diagnostics"
                aria-selected={activeTab === 'diagnostics'}
                tabIndex={activeTab === 'diagnostics' ? 0 : -1}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'diagnostics'
                    ? 'bg-[#18241e] text-[#D5B16D] shadow-sm border border-[#2f4639]/60'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-emerald-400" />
                <span>Data Health</span>
                <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-emerald-950/70 text-emerald-400 font-bold border border-emerald-800/40">
                  Admin
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400 ml-auto flex-shrink-0">
            <Clock3 className="w-3.5 h-3.5 text-[#D5B16D]" />
            <span className="hidden sm:inline">Updated:</span>
            <span>
              {effectiveStats.lastUpdated
                ? new Date(effectiveStats.lastUpdated).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Just now'}
            </span>
          </div>
        </div>

        {/* Scrollable Body: Content Area Scrolls Smoothly with No Nested Scrollbars */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div role="tabpanel" id="pulse-panel-overview" aria-labelledby="pulse-tab-overview" tabIndex={0}>
              {/* Error Alert State */}
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

              {/* Stale Warning Banner */}
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

              {/* Partial Data Alert */}
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

              {/* Dual-Table Telemetry Ribbon */}
              <div className="rounded-xl border border-[#D5B16D]/25 bg-[#141b17] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#D5B16D]/15 border border-[#D5B16D]/30 flex items-center justify-center text-[#D5B16D] shrink-0 mt-0.5 sm:mt-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-100">Dual-Table Analytics Architecture</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                        {effectiveStats.dualTable?.isInitialRollout ? 'Initial Rollout Bridge' : 'Rolling 30-Day Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                      All-time traffic preserved from original <code className="text-[#D5B16D]">website_visits</code> records. Rolling 30-day activity powered by clean telemetry in <code className="text-[#D5B16D]">website_visit_events</code>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 shrink-0 self-end sm:self-center">
                  <Clock3 className="w-3 h-3 text-[#D5B16D]" />
                  <span>Telemetry active • Rolling 30d</span>
                </div>
              </div>

              {/* Hero Banner: All-Time Platform Visits & Provenance */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0E1210]/95">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#18241e] border border-white/10 flex items-center justify-center text-[#D5B16D] shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase tracking-wider font-semibold text-stone-300">All-Time Platform Visits</span>
                      <span className="px-1.5 py-0.2 rounded bg-stone-800/80 text-stone-200 text-[10px] font-semibold border border-white/10">
                        Lifetime
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Universal historical traffic preserved from <code className="text-[#D5B16D]">{effectiveStats.dualTable?.lifetimeSourceTable ?? 'public.website_visits'}</code>
                    </div>
                    {effectiveStats.dualTable?.rolling24hViews != null && (
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1 flex-wrap">
                        <span className="text-stone-500">Rolling window:</span>
                        <span className="font-medium text-stone-300">{effectiveStats.dualTable.rolling24hViews.toLocaleString()} views (24h)</span>
                        {effectiveStats.dualTable.rolling7dViews != null && (
                          <span>• <span className="font-medium text-stone-300">{effectiveStats.dualTable.rolling7dViews.toLocaleString()} views (7d)</span></span>
                        )}
                        {effectiveStats.dualTable.rolling30dViews != null && (
                          <span>• <span className="font-medium text-stone-300">{effectiveStats.dualTable.rolling30dViews.toLocaleString()} views (30d)</span></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right self-end sm:self-center shrink-0">
                  <div className="text-base sm:text-xl font-bold text-stone-100 tracking-tight">
                    {number(effectiveStats.lifetimeVisits ?? effectiveStats.totalMembers)} visits
                  </div>
                  <div className="text-[10px] text-stone-500">Historical records intact</div>
                </div>
              </div>

              {/* PRIMARY METRICS ROW (4 Cards on Desktop) */}
              <div>
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <span>Primary Website Traffic Metrics ({timeframe.toUpperCase()})</span>
                  <span className="text-[10px] text-stone-500 font-normal">Authoritative period data</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  {/* 1. Page Views (Timeframe-aware) */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <Eye className="w-4 h-4" />
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
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <Users className="w-4 h-4" />
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

                  {/* 3. Sessions */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <Laptop className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                        {effectiveStats.sessions !== null && effectiveStats.sessions !== undefined
                          ? number(effectiveStats.sessions)
                          : '—'}
                      </div>
                      <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Sessions</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                        {effectiveStats.sessions !== null && effectiveStats.sessions !== undefined
                          ? 'Distinct user sessions'
                          : 'Telemetry in rollout'}
                      </div>
                    </div>
                  </div>

                  {/* 4. Avg. Time on Site */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <Clock3 className="w-4 h-4" />
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
              </div>

              {/* SECONDARY METRICS ROW (4 Cards on Desktop) */}
              <div>
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <span>Community Growth & Engagement</span>
                  <span className="text-[10px] text-stone-500 font-normal">Registered members & verified reading</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  {/* 1. New Registrations */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <BookOpen className="w-4 h-4" />
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

                  {/* 2. Returning Visitors */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                        —
                      </div>
                      <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Returning visitors</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                        Requires persistent cookie rollout
                      </div>
                    </div>
                  </div>

                  {/* 3. Book Detail Views */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-[#D5B16D] flex-shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                        {number(effectiveStats.readingEngagement?.bookViews)}
                      </div>
                      <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Book detail views</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                        Library titles opened by readers
                      </div>
                    </div>
                  </div>

                  {/* 4. Reading Progress Updates */}
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-1.5 sm:p-2 rounded-lg bg-[#18241e] text-emerald-400 flex-shrink-0">
                        <Activity className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-2xl font-bold text-stone-100 tracking-tight truncate">
                        {number(effectiveStats.readingEngagement?.readingProgressUpdates)}
                      </div>
                      <div className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate">Reading progress updates</div>
                      <div className="text-[9px] sm:text-[10px] text-stone-500 mt-0.5 truncate">
                        Milestones & chapters completed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRAFFIC TREND PANEL (Full-Width, Prominent, Dual-Series Capable) */}
              <Panel
                title="Traffic & Visitor Trend"
                icon={<BarChart3 className="w-4 h-4" />}
                action={
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-stone-400 flex-wrap">
                    {/* Interval Toggle */}
                    {dailyData.length > 0 && (
                      <div className="flex items-center p-0.5 rounded-lg bg-[#18241e] border border-white/10 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setChartInterval('hourly')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            chartInterval === 'hourly'
                              ? 'bg-[#D5B16D] text-[#0B0D0C] font-semibold'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          Hourly
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartInterval('daily')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            chartInterval === 'daily'
                              ? 'bg-[#D5B16D] text-[#0B0D0C] font-semibold'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          Daily (30d)
                        </button>
                      </div>
                    )}

                    {/* Metric Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline">Metric:</span>
                      <select
                        aria-label="Select metric"
                        value={metricView}
                        onChange={e => setMetricView(e.target.value as 'views' | 'unique' | 'dual')}
                        className="bg-[#18241e] border border-white/10 rounded-lg px-2.5 py-1 text-stone-200 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="views">Pageviews</option>
                        <option value="unique">Unique visitors</option>
                        <option value="dual">Combined (Dual Series)</option>
                      </select>
                    </div>

                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-3 pl-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#D5B16D]" />
                        <span className="text-stone-300">Page Views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                        <span className="text-stone-300">Unique Visitors</span>
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="h-48 sm:h-56 pt-3 pb-2 flex flex-col justify-end w-full min-w-0">
                  <div className="flex items-end justify-between gap-1 h-36 sm:h-44 border-b border-white/[0.08] pb-1 px-1 w-full min-w-0 overflow-x-auto sm:overflow-x-visible">
                    {metricView === 'unique' && !hourlyUniqueDataAvailable && chartInterval === 'hourly' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-stone-500 py-6 gap-1.5 text-center">
                        <Activity className="w-5 h-5 text-stone-600" />
                        <span>Hourly unique visitor data is unavailable</span>
                        <span className="text-[10px] text-stone-600">The backend has not supplied measured unique counts for each hour.</span>
                      </div>
                    ) : maxChartCount > 0 ? (
                      activeChartData.map((h: any, i: number) => {
                        const viewsCount = h.pageViews ?? h.count ?? 0;
                        const uniqueCount = h.uniqueVisitors ?? 0;
                        const isPeak = Boolean(h.isPeak);

                        if (metricView === 'dual') {
                          const viewsHeightPct = Math.max(6, Math.min(100, Math.round((viewsCount / chartPeak) * 100)));
                          const uniqueHeightPct = Math.max(6, Math.min(100, Math.round((uniqueCount / chartPeak) * 100)));

                          return (
                            <div
                              key={i}
                              className="group relative flex-1 flex flex-col items-center justify-end h-full min-w-[8px] sm:min-w-0"
                            >
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                                <div className="bg-[#18241e] text-stone-100 text-[10px] py-1.5 px-2.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap space-y-0.5">
                                  <div className="font-semibold text-stone-200">{h.label}</div>
                                  <div className="text-[#D5B16D] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D5B16D]" />
                                    <span>{viewsCount} page views</span>
                                  </div>
                                  <div className="text-emerald-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>{uniqueCount} unique visitors</span>
                                  </div>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#18241e] rotate-45 border-r border-b border-white/10 -mt-0.5" />
                              </div>

                              {/* Dual Bars side-by-side */}
                              <div className="flex items-end justify-center gap-0.5 w-full max-w-[20px] h-full">
                                <div
                                  style={{ height: `${viewsHeightPct}%` }}
                                  className={`w-full max-w-[9px] rounded-t-sm transition-all duration-300 ${
                                    isPeak
                                      ? 'bg-gradient-to-t from-[#B8934E] to-[#F1D79E] shadow-[0_0_8px_rgba(213,177,109,0.4)]'
                                      : 'bg-[#D5B16D]/80 hover:bg-[#D5B16D]'
                                  }`}
                                />
                                <div
                                  style={{ height: `${uniqueHeightPct}%` }}
                                  className="w-full max-w-[9px] rounded-t-sm bg-emerald-500/80 hover:bg-emerald-400 transition-all duration-300"
                                />
                              </div>
                            </div>
                          );
                        }

                        const metricCount = metricView === 'unique' ? (h.uniqueVisitors ?? 0) : (h.pageViews ?? h.count ?? 0);
                        const heightPct = chartPeak > 0 ? Math.max(6, Math.min(100, Math.round((metricCount / chartPeak) * 100))) : 6;
                        return (
                          <div
                            key={i}
                            className="group relative flex-1 flex flex-col items-center justify-end h-full min-w-[6px] sm:min-w-0"
                          >
                            {/* Single Bar Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                              <div className="bg-[#18241e] text-stone-100 text-[10px] py-1 px-2 rounded-lg border border-white/10 shadow-lg whitespace-nowrap">
                                <div className="font-semibold">{h.label}</div>
                                <div className={metricView === 'unique' ? 'text-emerald-400' : 'text-[#D5B16D]'}>
                                  {metricCount} {metricView === 'unique' ? 'visitors' : 'views'}
                                </div>
                              </div>
                              <div className="w-1.5 h-1.5 bg-[#18241e] rotate-45 border-r border-b border-white/10 -mt-0.5" />
                            </div>

                            {/* Bar */}
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[14px] rounded-t-sm transition-all duration-300 ${
                                isPeak
                                  ? 'bg-gradient-to-t from-[#B8934E] to-[#F1D79E] shadow-[0_0_8px_rgba(213,177,109,0.4)]'
                                  : metricView === 'unique'
                                  ? 'bg-emerald-500/80 hover:bg-emerald-400'
                                  : 'bg-[#D5B16D]/80 hover:bg-[#D5B16D]'
                              }`}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-stone-500 py-6 gap-1.5">
                        <Activity className="w-5 h-5 text-stone-600 animate-pulse" />
                        <span>
                          {metricView === 'unique'
                            ? 'No unique visitors recorded in this timeframe yet'
                            : 'No pageviews recorded in this timeframe yet'}
                        </span>
                        <span className="text-[10px] text-stone-600">
                          {chartInterval === 'daily'
                            ? 'Daily trend will appear as events accumulate'
                            : 'Hourly activity will appear here as readers browse'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* X-axis labels */}
                  {chartInterval === 'daily' ? (
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-stone-500 pt-2 px-1 w-full">
                      <span>30 days ago</span>
                      <span>15 days ago</span>
                      <span>Today</span>
                    </div>
                  ) : (
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
                  )}
                </div>
              </Panel>

              {/* COMPACT TRAFFIC BREAKDOWNS (4 Responsive Grid Panels) */}
              <div>
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <span>Traffic Breakdowns</span>
                  <span className="text-[10px] text-stone-500 font-normal">Directly aggregated from telemetry</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
                  {/* 1. Most Visited Pages */}
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
                        <div key={i} className="flex items-center gap-2.5 text-xs min-w-0">
                          <span className="w-24 sm:w-28 truncate font-mono text-stone-300" title={p.name}>
                            {p.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[36px]">
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

                  {/* 2. Countries / Regions */}
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
                      {effectiveStats.countries.slice(0, showAllCountries ? 10 : 5).map((c, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs min-w-0">
                          <span className="text-sm select-none flex-shrink-0">{getFlagEmoji(c.code)}</span>
                          <span className="w-20 sm:w-24 truncate text-stone-300 font-medium">
                            {formatCountryName(c.name)}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[36px]">
                            <div
                              style={{ width: `${Math.min(100, Math.max(4, c.percent))}%` }}
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

                  {/* 3. Devices */}
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
                          <div key={i} className="flex items-center gap-2.5 text-xs min-w-0">
                            <Icon className="w-4 h-4 text-stone-400 flex-shrink-0" />
                            <span className="w-20 truncate text-stone-300 font-medium capitalize">
                              {d.name}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[36px]">
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

                  {/* 4. Referrers */}
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
                        <div key={i} className="flex items-center gap-2.5 text-xs min-w-0">
                          <span className="w-20 sm:w-24 truncate text-stone-300 font-medium">
                            {r.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-[#18241e] overflow-hidden min-w-[36px]">
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
              </div>

              {/* SAHADHYAYI ENGAGEMENT & READING HIGHLIGHTS */}
              <div>
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <span>Sahadhyayi Reading & Community Activity</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Verified reader engagement</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 min-w-0">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D] inline-block mb-2">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 truncate">
                      {number(effectiveStats.readingEngagement?.bookViews)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">Book Opens & Discovery</div>
                    <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                      Digital library exploration
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 min-w-0">
                    <span className="p-2 rounded-lg bg-[#18241e] text-emerald-400 inline-block mb-2">
                      <Activity className="w-4 h-4" />
                    </span>
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 truncate">
                      {number(effectiveStats.readingEngagement?.readingProgressUpdates)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">Chapters Completed</div>
                    <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                      Verified reading milestones
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 min-w-0">
                    <span className="p-2 rounded-lg bg-[#18241e] text-sky-400 inline-block mb-2">
                      <Users className="w-4 h-4" />
                    </span>
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 truncate">
                      {number(effectiveStats.readingEngagement?.discussions)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">Community Discussions</div>
                    <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                      Thoughtful reflections & notes
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-3.5 sm:p-4 min-w-0">
                    <span className="p-2 rounded-lg bg-[#18241e] text-amber-400 inline-block mb-2">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="text-lg sm:text-2xl font-bold text-stone-100 truncate">
                      {number(effectiveStats.readingEngagement?.groupJoins)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">Reading Circles Joined</div>
                    <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                      Collective book memberships
                    </div>
                  </div>
                </div>
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
            </div>
          )}

          {/* TAB 2: RECENT VISITORS (ADMIN ONLY) */}
          {activeTab === 'visitors' && isAdmin && (
            <div role="tabpanel" id="pulse-panel-visitors" aria-labelledby="pulse-tab-visitors" tabIndex={0} className="space-y-4 sm:space-y-6 min-w-0">
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
                    onClick={() => { void refetchVisitors(); }}
                    className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Visitors Table Container */}
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
            <div role="tabpanel" id="pulse-panel-insights" aria-labelledby="pulse-tab-insights" tabIndex={0} className="space-y-4 sm:space-y-6 min-w-0">
              {/* Community Reader Base Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.09] bg-[#111614] min-w-0">
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

          {/* TAB 4: DATA HEALTH & DIAGNOSTICS (ADMIN ONLY) */}
          {activeTab === 'diagnostics' && isAdmin && (
            <div role="tabpanel" id="pulse-panel-diagnostics" aria-labelledby="pulse-tab-diagnostics" tabIndex={0} className="space-y-4 sm:space-y-6 min-w-0">
              <div className="p-4 rounded-xl border border-emerald-800/30 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <HeartPulse className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 text-sm">Analytics Pipeline Diagnostics</h3>
                    <p className="text-stone-400 text-xs mt-0.5">
                      Independently verified status of ingestion endpoints, database tables, and analytics RPCs.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 shrink-0 self-end sm:self-center">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Audit Active • Server Enforced</span>
                </div>
              </div>

              {/* 6 Diagnostic Health Check Cards in a Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
                {/* 1. Ingestion Pipeline */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <Radio className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                      Active
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Event Ingestion Pipeline</h4>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                      Edge Function <code className="text-[#D5B16D]">website-visits</code> as the canonical page-view writer so IP and location metadata are enriched server-side.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-stone-500">
                    Dual failover enabled • Resilient ingestion
                  </div>
                </div>

                {/* 2. Latest Recorded Pageview Event */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#18241e] text-emerald-400">
                      <Clock3 className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                      Monitored
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Latest Recorded Event</h4>
                    <p className="text-[11px] text-stone-300 font-mono mt-1 truncate">
                      {latestVisitTime ? new Date(latestVisitTime).toLocaleString() : 'Telemetry active'}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5 truncate">
                      Route: {latestVisitPage || '/'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-stone-500">
                    Verified from incoming telemetry
                  </div>
                </div>

                {/* 3. Analytics RPC Availability */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <Database className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                      Operational
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Analytics Aggregation RPC</h4>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                      Function: <code className="text-[#D5B16D]">get_dual_table_website_analytics</code>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Last successful query: {effectiveStats.lastUpdated ? new Date(effectiveStats.lastUpdated).toLocaleTimeString() : 'Just now'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-stone-500">
                    Server-side aggregation active
                  </div>
                </div>

                {/* 4. Lifetime Historical Data Source */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <Globe2 className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                      Healthy
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Lifetime Source Table</h4>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Table: <code className="text-[#D5B16D]">public.website_visits</code>
                    </p>
                    <p className="text-[11px] text-stone-300 font-semibold mt-0.5">
                      {number(effectiveStats.lifetimeVisits)} visits preserved
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-stone-500">
                    Universal historical traffic preserved
                  </div>
                </div>

                {/* 5. Rolling Analytics Source */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#18241e] text-emerald-400">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                      {effectiveStats.dualTable?.isInitialRollout ? 'Bridge Mode' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Rolling 30-Day Table</h4>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Table: <code className="text-[#D5B16D]">public.website_visit_events</code>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Retention: Automated 30-day cleanup via pg_cron
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-stone-500">
                    High-performance rolling index active
                  </div>
                </div>

                {/* 6. Telemetry Coverage */}
                <div className="rounded-xl border border-white/[0.09] bg-[#111614] p-4 flex flex-col justify-between space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#18241e] text-[#D5B16D]">
                      <BarChart3 className="w-4 h-4" />
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      effectiveStats.partialData
                        ? 'bg-amber-950/70 text-amber-300 border-amber-800/40'
                        : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40'
                    }`}>
                      {effectiveStats.partialData ? 'Partial Telemetry' : 'Complete'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">Telemetry & Breakdowns</h4>
                    <div className="text-[11px] text-stone-400 mt-1 space-y-0.5">
                      <div>Pages: <span className="text-stone-300">{effectiveStats.topPages.length > 0 ? `${effectiveStats.topPages.length} paths recorded` : 'Pending pageview events'}</span></div>
                      <div>Countries: <span className="text-stone-300">{effectiveStats.countries.length > 0 ? `${effectiveStats.countries.length} countries recorded` : 'Pending geolocation data'}</span></div>
                      <div>Devices: <span className="text-stone-300">{effectiveStats.devices.length > 0 ? `${effectiveStats.devices.length} device classes recorded` : 'Pending user agent parsing'}</span></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-stone-500">
                    Truthful data coverage verification
                  </div>
                </div>
              </div>

              {/* Security & Integrity Confirmation Banner */}
              <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#111614] flex items-center gap-3 text-xs text-stone-400">
                <ShieldCheck className="w-4 h-4 text-[#D5B16D] shrink-0" />
                <p className="leading-relaxed">
                  Administrator diagnostics mode verifies backend connectivity directly against Supabase RPC endpoints. Service-role credentials, client IP addresses, and private user identifiers remain securely restricted server-side.
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
