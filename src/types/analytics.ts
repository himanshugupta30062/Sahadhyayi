/**
 * Authoritative Analytics Contract for Sahadhyayi
 * 
 * Defines strict types for website traffic, community activity, and telemetry.
 * All metrics distinguish between measured zero (0) and missing/untracked (null / 'unavailable').
 */

export type AnalyticsTimeframe = '24h' | '7d' | '30d';

export type MetricStatus = 'available' | 'unavailable';

export interface AnalyticsMetric<T = number> {
  value: T | null;
  status: MetricStatus;
  definition?: string;
}

export interface MetricComparison {
  value: number | null; // e.g. +14% or -5%, null if baseline is 0 or unavailable
  previousPeriodValue: number | null;
  label?: string; // e.g. "vs previous 24h"
}

export interface HourlyBucket {
  hourIndex: number;
  bucketStart?: string;
  label: string;
  pageViews: number;
  isPeak?: boolean;
}

export interface BreakdownStat {
  name: string;
  code?: string;
  count: number;
  percent: number;
}

export interface TopMemberContributor {
  rank: number;
  userId: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  activityCount: number;
  totalPoints: number;
  breakdown?: {
    posts: number;
    comments: number;
    messages: number;
    chapters: number;
  };
}

export interface ReadingEngagementStats {
  bookOpens: AnalyticsMetric;
  readingProgressCompletions: AnalyticsMetric;
  groupJoins: AnalyticsMetric;
  discussions: AnalyticsMetric;
}

export interface CommunityPulseResponse {
  schemaVersion: 1;
  timeframe: AnalyticsTimeframe;
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  freshness: 'fresh' | 'cached';

  metrics: {
    registeredReaders: AnalyticsMetric;
    totalPageViews: AnalyticsMetric;
    periodPageViews: AnalyticsMetric;
    uniqueVisitors: AnalyticsMetric;
    newReaders: AnalyticsMetric;
    averageSessionDurationSeconds: AnalyticsMetric;
  };

  comparisons: {
    pageViewsChangePercent: number | null;
    uniqueVisitorsChangePercent: number | null;
    newReadersChangePercent: number | null;
  };

  hourlyActivity: HourlyBucket[];

  breakdowns: {
    countries: BreakdownStat[];
    pages: BreakdownStat[];
    devices: BreakdownStat[];
    referrers: BreakdownStat[];
  };

  engagement: ReadingEngagementStats;

  topMembers?: TopMemberContributor[];

  // Backward compatibility fields for legacy components
  totalSignups?: number;
  totalMembers?: number;
  newSignups24h?: number;
  newReaders?: number;
  totalVisits?: number;
  last24hVisits?: number;
  uniqueVisitors24h?: number | null;
  avgTimeOnSite?: string;
  topCountries?: BreakdownStat[];
  topPages?: BreakdownStat[];
  devices?: BreakdownStat[];
  referrers?: BreakdownStat[];
  readingEngagement?: {
    bookViews?: number | { count: number; tracked: boolean; label?: string };
    readingProgressUpdates?: number | { count: number; tracked: boolean; label?: string };
    groupJoins?: number | { count: number; tracked: boolean; label?: string };
    discussions?: number | { count: number; tracked: boolean; label?: string };
  };
}

