/**
 * Utility functions for Book Reels duration and playback time formatting.
 */

/**
 * Formats a duration in seconds into a clean badge label.
 * - Whole numbers: e.g. 10 -> "10s"
 * - Decimals: e.g. 7.5 -> "7.5s"
 * - Returns null for invalid, non-positive, or missing durations.
 */
export function formatReelDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) {
    return null;
  }
  const num = Number(seconds);
  if (num % 1 === 0) {
    return `${num}s`;
  }
  return `${num.toFixed(1)}s`;
}

/**
 * Formats seconds into a standard mm:ss display (e.g., 4 -> "00:04", 65 -> "01:05").
 */
export function formatReelTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
