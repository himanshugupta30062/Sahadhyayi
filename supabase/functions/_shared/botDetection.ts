/**
 * Shared server-side crawler filtering for website analytics.
 *
 * Match only the request User-Agent header (never a client-supplied body field).
 * This is an analytics exclusion, not an access-control or security boundary.
 */
const CRAWLER_USER_AGENT_PATTERN =
  /(?:\b(?:ahrefsbot|semrushbot|mj12bot|dotbot|blexbot|rogerbot|screaming frog|serpstatbot|seokicks|linkdexbot|majestic|sistrix|siteauditbot|bytespider|gptbot|chatgpt-user|claudebot|claude-web|anthropic-ai|googlebot|google-inspectiontool|bingbot|msnbot|duckduckbot|baiduspider|yandexbot|sogou|exabot|petalbot|applebot|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterestbot|redditbot|ia_archiver|archive\.org_bot|crawler|spider|bot)\b)/i;

export function isAutomatedCrawler(userAgent: string | null | undefined): boolean {
  return typeof userAgent === 'string' &&
    userAgent.length > 0 &&
    CRAWLER_USER_AGENT_PATTERN.test(userAgent);
}
