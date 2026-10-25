/** Pure validation helpers for the administrator-only community stats endpoint. */

const ALLOWED_TIMEFRAMES = new Set(["24h", "7d", "30d"]);

export function getCommunityStatsBearerToken(authorization: string | null): string | null {
  if (!authorization || authorization.length < 7 || authorization.slice(0, 7).toLowerCase() !== "bearer ") return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export function normalizeCommunityStatsTimeframe(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value.toLowerCase().trim()
    : "24h";
}

export function isAllowedCommunityStatsTimeframe(value: string): boolean {
  return ALLOWED_TIMEFRAMES.has(value);
}
