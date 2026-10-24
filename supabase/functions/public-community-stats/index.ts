import { createClient } from "npm:@supabase/supabase-js@2.112.3";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60, s-maxage=60" } });
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST" && req.method !== "GET") return respond({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return respond({ error: "Stats temporarily unavailable" }, 503);
  let timeframe = "24h";
  try {
    if (req.method === "POST") { const b = await req.json().catch(() => ({})); if (typeof b?.timeframe === "string") timeframe = b.timeframe.toLowerCase().trim(); }
    else timeframe = new URL(req.url).searchParams.get("timeframe")?.toLowerCase().trim() || "24h";
  } catch { timeframe = "24h"; }
  if (!["24h", "7d", "30d"].includes(timeframe)) return respond({ error: "Invalid timeframe" }, 400);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = Date.now(), ms = timeframe === "7d" ? 7 * 86400000 : timeframe === "30d" ? 30 * 86400000 : 86400000;
  const since = new Date(now - ms).toISOString();
  try {
    const [members, newMembers, totalViews, views] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("website_visits").select("id", { count: "exact", head: true }).eq("event_type", "pageview"),
      db.from("website_visits").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("visited_at", since),
    ]);
    if ([members, newMembers, totalViews, views].some(x => x.error)) return respond({ error: "Stats temporarily unavailable" }, 503);
    return respond({
      source: "public-aggregate", pageViews: views.count ?? 0, totalMembers: members.count ?? 0,
      newReaders: newMembers.count ?? 0, totalVisits: totalViews.count ?? 0,
      period: { pageViews: views.count ?? 0, registeredReaders: members.count ?? 0, newRegistrations: newMembers.count ?? 0 },
      hourlyActivity: [], dailyActivity: [], breakdowns: { countries: [], pages: [], devices: [], referrers: [] },
      readingEngagement: { bookViews: null, readingProgressUpdates: null, groupJoins: null, discussions: null },
      partialData: true, lastUpdated: new Date(now).toISOString()
    });
  } catch (e) { console.error("Public stats failed", e); return respond({ error: "Stats temporarily unavailable" }, 503); }
});