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
      { count: totalSignupsCount },
      { count: newSignupsPeriodCount },
      { count: totalVisitsCount },
      { count: periodVisitsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      supabase.from("website_visits").select("*", { count: "exact", head: true }),
      supabase.from("website_visits").select("*", { count: "exact", head: true }).gte("visited_at", timeframeStart),
    ]);

    const totalSignups = totalSignupsCount ?? 0;
    const newSignups = newSignupsPeriodCount ?? 0;
    const totalVisits = totalVisitsCount ?? 0;
    const periodVisits = periodVisitsCount ?? 0;

    // 3. Hourly buckets for 24h: format with Asia/Kolkata timezone
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

    // 4. Fallback reading engagement counts
    const [
      { count: bookViewsCount },
      { count: progressCount },
      { count: groupJoinsCount },
      { count: postsCount },
      { count: commentsCount },
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
      uniqueVisitors24h: null,
      hourlyActivity,
      peakHour: null,
      topCountries: [],
      topCities: [],
      mostVisitedCity24h: null,
      topMembers: [],
      readingEngagement: {
        bookViews: { count: bookViewsCount ?? 0, tracked: true, label: "Book Views & Discovery" },
        readingProgressUpdates: { count: progressCount ?? 0, tracked: true, label: "Progress Updates & Chapters" },
        groupJoins: { count: groupJoinsCount ?? 0, tracked: true, label: "Group Memberships Joined" },
        discussions: { count: (postsCount ?? 0) + (commentsCount ?? 0), tracked: true, label: "Discussions & Comments" },
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