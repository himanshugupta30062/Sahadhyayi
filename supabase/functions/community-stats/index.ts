import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TIMEFRAMES = new Set(["24h", "7d", "30d"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Community stats service temporarily unavailable" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // 1. Parse and strictly validate timeframe parameter
    let timeframe = "24h";
    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.timeframe && typeof body.timeframe === "string") {
          timeframe = body.timeframe.toLowerCase().trim();
        }
      } catch {
        timeframe = "24h";
      }
    } else {
      try {
        const urlObj = new URL(req.url);
        const tf = urlObj.searchParams.get("timeframe");
        if (tf) timeframe = tf.toLowerCase().trim();
      } catch {
        timeframe = "24h";
      }
    }

    if (!ALLOWED_TIMEFRAMES.has(timeframe)) {
      return new Response(
        JSON.stringify({ error: "Invalid timeframe. Supported: 24h, 7d, 30d" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Invoke the server-side PostgreSQL aggregation RPC
    const { data: rpcStats, error: rpcError } = await supabase.rpc("get_community_pulse_stats", {
      p_timeframe: timeframe,
    });

    if (!rpcError && rpcStats && typeof rpcStats === "object") {
      // Direct return of sanitized, server-aggregated statistics
      return new Response(JSON.stringify(rpcStats), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, s-maxage=30",
        },
      });
    }

    // If RPC is unavailable (e.g., during migration deployment), execute targeted DB aggregates
    if (rpcError) {
      console.warn("get_community_pulse_stats RPC not found or failed, falling back to query aggregates:", rpcError.message);
    }

    const now = Date.now();
    const hours = timeframe === "7d" ? 168 : timeframe === "30d" ? 720 : 24;
    const timeframeStart = new Date(now - hours * 3600 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now - 24 * 3600 * 1000).toISOString();

    const [
      totalSignupsRes,
      newSignupsPeriodRes,
      totalVisitsRes,
      periodVisitsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      supabase.from("website_visits").select("*", { count: "exact", head: true }),
      supabase.from("website_visits").select("*", { count: "exact", head: true }).gte("visited_at", timeframeStart),
    ]);

    if (totalVisitsRes.error) {
      console.warn("Failed querying total visits:", totalVisitsRes.error.message);
    }
    if (periodVisitsRes.error) {
      console.warn("Failed querying period visits:", periodVisitsRes.error.message);
    }

    const totalSignups = totalSignupsRes.count ?? 0;
    const newSignups = newSignupsPeriodRes.count ?? 0;
    const totalVisits = totalVisitsRes.count ?? 0;
    const periodVisits = periodVisitsRes.count ?? 0;

    // 3. Compute real hourly activity and breakdowns from actual visits
    const hourlyActivity = [];
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: true,
    });

    for (let i = 0; i < 24; i++) {
      const d = new Date(now - (23 - i) * 3600 * 1000);
      hourlyActivity.push({
        hourIndex: i,
        label: formatter.format(d),
        count: 0,
        isPeak: false,
      });
    }

    const { data: recentVisitsData, error: rvError } = await supabase
      .from("website_visits")
      .select("visited_at, visitor_id, session_id, country_code, city, device_type, page_url, referrer")
      .gte("visited_at", timeframeStart)
      .limit(3000);

    if (rvError) {
      console.warn("Could not query recent visits for breakdown:", rvError.message);
    }

    const visitsList = Array.isArray(recentVisitsData) ? recentVisitsData : [];
    const uniqueVisitorIds = new Set<string>();
    const countryCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};

    for (const v of visitsList) {
      if (v.visitor_id) uniqueVisitorIds.add(String(v.visitor_id));

      // Hourly grouping (for last 24h)
      if (v.visited_at) {
        const time = new Date(v.visited_at).getTime();
        const diffHours = Math.floor((now - time) / (3600 * 1000));
        if (diffHours >= 0 && diffHours < 24) {
          const idx = 23 - diffHours;
          if (hourlyActivity[idx]) hourlyActivity[idx].count++;
        }
      }

      if (v.country_code) {
        const c = String(v.country_code).toUpperCase();
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      }
      if (v.city) {
        const city = String(v.city).trim();
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
      if (v.device_type) {
        const dt = String(v.device_type).trim();
        deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
      }
      if (v.page_url) {
        try {
          const clean = new URL(v.page_url, "https://sahadhyayi.com").pathname;
          pageCounts[clean] = (pageCounts[clean] || 0) + 1;
        } catch {
          const rawClean = v.page_url.split("?")[0].split("#")[0] || "/";
          pageCounts[rawClean] = (pageCounts[rawClean] || 0) + 1;
        }
      }
      const ref = v.referrer ? v.referrer.trim() : "";
      if (!ref || ref === "direct") {
        referrerCounts["Direct"] = (referrerCounts["Direct"] || 0) + 1;
      } else {
        try {
          const host = new URL(ref).hostname.replace(/^www\./, "");
          const label = host.includes("google") ? "Google"
            : host.includes("twitter") || host.includes("t.co") || host.includes("x.com") ? "Twitter"
            : host.includes("reddit") ? "Reddit"
            : host.includes("facebook") ? "Facebook"
            : host;
          referrerCounts[label] = (referrerCounts[label] || 0) + 1;
        } catch {
          referrerCounts["Other"] = (referrerCounts["Other"] || 0) + 1;
        }
      }
    }

    // Determine peak hour
    let maxHourlyCount = 0;
    let peakHourLabel: string | null = null;
    for (const h of hourlyActivity) {
      if (h.count > maxHourlyCount) {
        maxHourlyCount = h.count;
        peakHourLabel = h.label;
      }
    }
    if (maxHourlyCount > 0) {
      for (const h of hourlyActivity) {
        if (h.count === maxHourlyCount) h.isPeak = true;
      }
    }

    const totalTrackedVisits = visitsList.length || 1;
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({
        code,
        name: code,
        count,
        percent: Math.round((count / totalTrackedVisits) * 100),
      }));

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalTrackedVisits) * 100),
      }));

    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalTrackedVisits) * 100),
      }));

    const devices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalTrackedVisits) * 100),
      }));

    const referrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalTrackedVisits) * 100),
      }));

    // 4. Fallback reading engagement counts
    const [
      bookViewsRes,
      progressRes,
      groupJoinsRes,
      postsRes,
      commentsRes,
    ] = await Promise.all([
      supabase.from("website_visits").select("*", { count: "exact", head: true }).gte("visited_at", timeframeStart).or("event_name.in.(book_opened,discovery_book_opened),page_url.ilike.%/book/%,page_url.ilike.%/reader/%"),
      supabase.from("reading_room_events").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart).eq("kind", "chapter_complete"),
      supabase.from("group_members").select("*", { count: "exact", head: true }).gte("joined_at", timeframeStart),
      supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      supabase.from("post_comments").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
    ]);

    const fallbackPayload = {
      timeframe,
      totalSignups,
      newSignups24h: newSignups,
      totalVisits,
      last24hVisits: periodVisits,
      uniqueVisitors24h: uniqueVisitorIds.size > 0 ? uniqueVisitorIds.size : null,
      hourlyActivity,
      peakHour: peakHourLabel,
      topCountries,
      topCities,
      topPages,
      devices,
      referrers,
      mostVisitedCity24h: topCities[0]?.name || null,
      topMembers: [],
      readingEngagement: {
        bookViews: { count: bookViewsRes.count ?? 0, tracked: true, label: "Book Views & Discovery" },
        readingProgressUpdates: { count: progressRes.count ?? 0, tracked: true, label: "Progress Updates & Chapters" },
        groupJoins: { count: groupJoinsRes.count ?? 0, tracked: true, label: "Group Memberships Joined" },
        discussions: { count: (postsRes.count ?? 0) + (commentsRes.count ?? 0), tracked: true, label: "Discussions & Comments" },
      },
      lastUpdated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(fallbackPayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30, s-maxage=30",
      },
    });
  } catch (error) {
    console.error("Critical error in community-stats edge function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process community statistics" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});