import React, { useMemo } from 'react';
import { Users, BookOpen, MapPin, TrendingUp, Clock } from 'lucide-react';
import { useCommunityPulse } from '@/hooks/useCommunityPulse';

/**
 * CommunityPulseBar — Live community stats for anonymous visitors.
 * Uses the public-safe aggregate endpoint (public-community-stats Edge Function)
 * so no auth is required. Shows real-time reading activity snapshot.
 */
export const CommunityPulseBar: React.FC<{ className?: string }> = ({ className = '' }) => {

  // Use the hook with isOpen=true to trigger the public fetch
  const { stats, loading, error } = useCommunityPulse(true);

  // Format large numbers with K/M suffix
  const formatNumber = (num: number | null | undefined): string => {
    if (!num || !Number.isFinite(num)) return '—';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate derived stats using useMemo (must be called unconditionally)
  const readersOnline = useMemo(() => {
    if (!stats?.hourlyActivity?.length) return null;
    const now = new Date();
    const currentHour = now.getHours();
    const hourData = stats.hourlyActivity.find(h => h.hourIndex === currentHour);
    return hourData?.uniqueVisitors ?? hourData?.count ?? null;
  }, [stats]);

  const topCity = useMemo(() => {
    if (!stats?.countries?.length) return null;
    return stats.countries[0]?.name ?? null;
  }, [stats]);

  const topBookActivity = useMemo(() => {
    if (!stats?.readingEngagement?.bookViews) return null;
    return stats.readingEngagement.bookViews;
  }, [stats]);

  const activeDiscussions = useMemo(() => {
    if (!stats?.readingEngagement?.discussions) return null;
    return stats.readingEngagement.discussions;
  }, [stats]);

  const totalMembers = stats?.totalMembers ?? stats?.dualTable?.lifetimeVisits ?? null;

  const statItems = useMemo(() => [
    {
      label: 'Readers online',
      value: readersOnline ? formatNumber(readersOnline) : '—',
      icon: Users,
      description: 'Right now',
      hasData: !!readersOnline,
    },
    {
      label: 'Active cities',
      value: topCity || '—',
      icon: MapPin,
      description: 'Global community',
      hasData: !!topCity,
    },
    {
      label: 'Books being read',
      value: topBookActivity ? formatNumber(topBookActivity) : '—',
      icon: BookOpen,
      description: 'In the last hour',
      hasData: !!topBookActivity,
    },
    {
      label: 'Live discussions',
      value: activeDiscussions ? formatNumber(activeDiscussions) : '—',
      icon: TrendingUp,
      description: 'Margin notes & threads',
      hasData: !!activeDiscussions,
    },
  ], [readersOnline, topCity, topBookActivity, activeDiscussions]);

  const hasAnyData = statItems.some(item => item.hasData) || totalMembers;

  // Loading state
  if (loading && !stats) {
    return (
      <div className="rounded-2xl border border-[#E5E0D8] bg-white/80 dark:border-[#242E28] dark:bg-[#131715]/80 p-4 animate-pulse" aria-hidden="true">
        <div className="flex items-center gap-4">
          <div className="h-8 w-32 rounded bg-[#E5E0D8] dark:bg-[#242E28]" />
          <div className="h-8 w-40 rounded bg-[#E5E0D8] dark:bg-[#242E28]" />
          <div className="h-8 w-36 rounded bg-[#E5E0D8] dark:bg-[#242E28]" />
          <div className="h-8 w-44 rounded bg-[#E5E0D8] dark:bg-[#242E28]" />
        </div>
      </div>
    );
  }

  // Error or no data - fail silently for anonymous users
  if ((error && !stats) || !hasAnyData) {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white/90 dark:border-[#242E28] dark:bg-[#131715]/90 p-4 sm:p-6 shadow-sm backdrop-blur-sm ${className}`}
      role="region"
      aria-label="Live community pulse"
    >
      {/* Subtle animated gradient border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
        style={{
          background: 'linear-gradient(90deg, #8F681C, #D5B16D, #8F681C)',
          backgroundSize: '200% 100%',
          animation: 'pulse-border 8s linear infinite',
        }}
        aria-hidden="true"
      >
        <style>{`
          @keyframes pulse-border {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
        `}</style>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Live indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inset-0 h-full w-full rounded-full bg-[#8F681C] opacity-75" />
            <span className="relative flex h-full w-full rounded-full bg-[#8F681C]" />
          </span>
          <span>Live community pulse</span>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#171C19] border border-[#E5E0D8]/60 dark:border-[#242E28]/60 transition-all hover:border-[#8F681C]/40 dark:hover:border-[#D5B16D]/40"
            >
              <item.icon
                className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D] shrink-0"
                aria-hidden="true"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] tabular-nums">
                  {item.value}
                </span>
                <span className="text-[10px] text-[#636B65] dark:text-[#A5ADA6] truncate">
                  {item.label}
                </span>
              </div>
              {index < statItems.length - 1 && (
                <span className="w-px h-6 bg-[#E5E0D8] dark:bg-[#242E28] mx-1" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        {/* Total members badge */}
        {totalMembers && (
          <div className="shrink-0 ml-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C442D]/10 dark:bg-[#D5B16D]/10 border border-[#1C442D]/20 dark:border-[#D5B16D]/20 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{formatNumber(totalMembers)}+ fellow readers</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPulseBar;