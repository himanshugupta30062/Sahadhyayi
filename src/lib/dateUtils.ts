import { formatDistanceToNow } from 'date-fns';

/**
 * Safely format a date to a distance-from-now string (e.g. "5 minutes ago").
 * If the input is null, undefined, invalid, or date-fns throws a RangeError,
 * it returns the fallback string instead of crashing the React tree.
 */
export const safeFormatDistanceToNow = (
  date: string | number | Date | null | undefined,
  options?: {
    includeSeconds?: boolean;
    addSuffix?: boolean;
    locale?: any;
  },
  fallback = 'recently'
): string => {
  if (!date) return fallback;
  try {
    const parsed = new Date(date);
    if (Number.Number.isNaN(parsed.getTime())) return fallback;
    return formatDistanceToNow(parsed, options);
  } catch {
    return fallback;
  }
};
