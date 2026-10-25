import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60, s-maxage=60" },
});
const pageviewTypes = ["pageview", "page_view", "view"];
const timeframeMs: Record<string, number> = { "24h": 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 };
const groupCounts = (rows: Record<string, any>[], key: string, limit = 8) => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[key] ?? "").trim();
    if (!value || value.toLowerCase() === "unknown" || value === "/") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([name, count]) => ({ name, count, percent: total ? Math.round(count * 1000 / total) / 10 : 0 }));
};
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST" && req.method !== "GET") return respond({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return respond({ error: "Stats temporarily unavailable" }, 503);
  let timeframe = "24h";
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.timeframe === "string") timeframe = body.timeframe.toLowerCase().trim();
    } else timeframe = new URL(req.url).searchParams.get("timeframe")?.toLowerCase().trim() || "24h";
  } catch { timeframe = "24h"; }
  if (!(timeframe in timeframeMs)) return respond({ error: "Invalid timeframe" }, 400);

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = Date.now();
  const sinceDate = new Date(now - timeframeMs[timeframe]);
  const since = sinceDate.toISOString();
  const since24h = new Date(now - timeframeMs["24h"]).toISOString();
  const since7d = new Date(now - timeframeMs["7d"]).toISOString();
  const since30d = new Date(now - timeframeMs["30d"]).toISOString();
  try {
    const [members, newMembers, lifetime, periodViews, views24, views7, views30, books, progress, joins, posts, comments] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("website_visits").select("id", { count: "exact", head: true }).in("event_type", pageviewTypes),
      db.from("website_visit_events").select("id", { count: "exact", head: true }).in("event_type", pageviewTypes).gte("created_at", since),
      db.from("website_visit_events").select("id", { count: "exact", head: true }).in("event_type", pageviewTypes).gte("created_at", since24h),
      db.from("website_visit_events").select("id", { count: "exact", head: true }).in("event_type", pageviewTypes).gte("created_at", since7d),
      db.from("website_visit_events").select("id", { count: "exact", head: true }).in("event_type", pageviewTypes).gte("created_at", since30d),
      db.from("website_visits").select("id", { count: "exact", head: true }).gte("visited_at", since).or("event_name.in.(book_opened,discovery_book_opened,reading_started),page_url.ilike.%/book/%,page_url.ilike.%/reader/%"),
      db.from("reading_room_events").select("id", { count: "exact", head: true }).gte("created_at", since).eq("kind", "chapter_complete"),
      db.from("group_members").select("id", { count: "exact", head: true }).gte("joined_at", since),
      db.from("posts").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("post_comments").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    const required = [members, newMembers, lifetime];
    if (required.some(x => x.error)) {
      console.error("Public aggregate required query failed", required.filter(x => x.error).map(x => x.error?.message));
      return respond({ error: "Stats temporarily unavailable" }, 503);
    }

    // Read only event fields needed for aggregate charts; never return visitor-level rows or identifiers.
    // Page through results so the breakdowns represent the selected interval, not just the first 1,000 events.
    const rows: Record<string, any>[] = [];
    const batchSize = 1000;
    let offset = 0;
    let truncated = false;
    while (offset < 20000) {
      const { data, error } = await db.from("website_visit_events")
        .select("created_at,page_path,referrer,device_type,country_code,event_type")
        .in("event_type", pageviewTypes).gte("created_at", since)
        .order("created_at", { ascending: false }).range(offset, offset + batchSize - 1);
      if (error) { console.error("Public aggregate breakdown query failed", error.message); break; }
      rows.push(...(data ?? []));
      if (!data || data.length < batchSize) break;
      offset += batchSize;
    }
    if (rows.length >= 20000) truncated = true;

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      const start = new Date(now - (24 - i) * 3600000);
      const end = new Date(now - (23 - i) * 3600000);
      const count = rows.filter(r => {
        const t = new Date(r.created_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      return { hourIndex: i, bucketStart: start.toISOString(), label: new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: true }).format(start), count, pageViews: count, isPeak: false };
    });
    const peak = Math.max(0, ...hourlyActivity.map(x => x.count));
    hourlyActivity.forEach(x => x.isPeak = peak > 0 && x.count === peak);

    const dailyActivity = Array.from({ length: timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30 }, (_, i, arr) => {
      const days = arr.length - 1 - i;
      const start = new Date(now - (days + 1) * 86400000);
      const end = new Date(now - days * 86400000);
      const matching = rows.filter(r => { const t = new Date(r.created_at).getTime(); return t >= start.getTime() && t < end.getTime(); });
      return { bucketDate: start.toISOString().slice(0, 10), label: new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", month: "short", day: "numeric" }).format(start), count: matching.length, pageViews: matching.length, uniqueVisitors: null };
    });

    const breakdowns = {
      countries: groupCounts(rows.map(r => ({ value: r.country_code })), "value"),
      pages: groupCounts(rows.map(r => ({ value: r.page_path })), "value"),
      devices: groupCounts(rows.map(r => ({ value: r.device_type })), "value"),
      referrers: groupCounts(rows.map(r => ({ value: r.referrer })), "value"),
    };
    const errors = [periodViews, views24, views7, views30, books, progress, joins, posts, comments].filter(x => x.error);
    const totalMembers = members.count ?? 0;
    const pageViews = periodViews.error ? (timeframe === "24h" ? views24.count : timeframe === "7d" ? views7.count : views30.count) : periodViews.count;
    return respond({
      schemaVersion: 2,
      source: "public-aggregate",
      timeframe,
      pageViews: pageViews ?? 0,
      totalMembers,
      newReaders: newMembers.count ?? 0,
      totalVisits: lifetime.count ?? 0,
      uniqueVisitors: null,
      sessions: null,
      period: { pageViews: pageViews ?? 0, registeredReaders: totalMembers, newRegistrations: newMembers.count ?? 0, uniqueVisitors: null, sessions: null },
      lifetime: { totalVisits: lifetime.count ?? 0, sourceTable: "public.website_visits" },
      rolling: { pageViews24h: views24.count ?? null, pageViews7d: views7.count ?? null, pageViews30d: views30.count ?? null, uniqueVisitors24h: null, uniqueVisitors7d: null, uniqueVisitors30d: null, sourceTable: "public.website_visit_events", collectionStartedAt: "2026-10-19T00:00:00Z", isInitialRollout: false },
      hourlyActivity,
      dailyActivity,
      breakdowns,
      topCountries: breakdowns.countries,
      topPages: breakdowns.pages,
      devices: breakdowns.devices,
      referrers: breakdowns.referrers,
      readingEngagement: {
        bookViews: books.error ? null : books.count,
        readingProgressUpdates: progress.error ? null : progress.count,
        groupJoins: joins.error ? null : joins.count,
        discussions: posts.error || comments.error ? null : (posts.count ?? 0) + (comments.count ?? 0),
      },
      comparisons: { pageViewsChangePercent: null, uniqueVisitorsChangePercent: null, newReadersChangePercent: null },
      partialData: truncated || rows.length === 0 || errors.length > 0,
      dataCoverage: { isPartial: truncated || errors.length > 0, reason: truncated ? "Breakdown sampling limit reached" : errors.length ? "Some optional metrics unavailable" : null },
      lastUpdated: new Date(now).toISOString(),
    });
  } catch (e) {
    console.error("Public stats failed", e);
    return respond({ error: "Stats temporarily unavailable" }, 503);
  }
});