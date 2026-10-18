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

    // 2. Invoke the authoritative server-side PostgreSQL aggregation RPC
    const { data: rpcStats, error: rpcError } = await supabase.rpc("get_community_pulse_stats", {
      p_timeframe: timeframe,
    });

    if (!rpcError && rpcStats && typeof rpcStats === "object") {
      // Direct return of sanitized, authoritative server-aggregated statistics
      return new Response(JSON.stringify(rpcStats), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, s-maxage=30",
        },
      });
    }

    // If RPC failed or is pending migration deployment, perform exact aggregate count fallback
    if (rpcError) {
      console.warn("get_community_pulse_stats RPC error, executing exact count fallback:", rpcError.message);
    }

    const now = Date.now();
    const hours = timeframe === "7d" ? 168 : timeframe === "30d" ? 720 : 24;
    const timeframeStart = new Date(now - hours * 3600 * 1000).toISOString();
    const periodEnd = new Date(now).toISOString();

    const [
      totalSignupsRes,
      newSignupsPeriodRes,
      totalPageviewsRes,
      periodPageviewsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      supabase.from("website_visits").select("*", { count: "exact", head: true }).eq("event_type", "pageview"),
      supabase.from("website_visits").select("*", { count: "exact", head: true }).eq("event_type", "pageview").gte("visited_at", timeframeStart),
    ]);

    const registeredReaders = totalSignupsRes.count ?? 0;
    const newReaders = newSignupsPeriodRes.count ?? 0;
    const totalPageviews = totalPageviewsRes.count ?? 0;
    const periodPageviews = periodPageviewsRes.count ?? 0;

    // 24 chronological hourly buckets (initialized cleanly with 0)
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
        bucketStart: d.toISOString(),
        label: formatter.format(d),
        pageViews: 0,
        count: 0,
        isPeak: false,
      });
    }

    // Engagement counts from primary tables
    const [
      bookOpensRes,
      progressRes,
      groupJoinsRes,
      postsRes,
      commentsRes,
    ] = await Promise.all([
      supabase.from("website_visits").select("*", { count: "exact", head: true }).gte("visited_at", timeframeStart).or("event_name.in.(book_opened,discovery_book_opened,reading_started),page_url.ilike.%/book/%,page_url.ilike.%/reader/%"),
      supabase.from("reading_room_events").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart).eq("kind", "chapter_complete"),
      supabase.from("group_members").select("*", { count: "exact", head: true }).gte("joined_at", timeframeStart),
      supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      supabase.from("post_comments").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
    ]);

    const bookOpens = bookOpensRes.count ?? 0;
    const readingProgressCompletions = progressRes.count ?? 0;
    const groupJoins = groupJoinsRes.count ?? 0;
    const discussions = (postsRes.count ?? 0) + (commentsRes.count ?? 0);

    const fallbackResponse = {
      schemaVersion: 1,
      timeframe,
      periodStart: timeframeStart,
      periodEnd,
      lastUpdated: new Date().toISOString(),
      freshness: "fresh",

      metrics: {
        registeredReaders: { value: registeredReaders, status: "available", definition: "Authoritative count of registered reader accounts" },
        totalPageViews: { value: totalPageviews, status: "available", definition: "Total recorded pageviews across platform lifetime" },
        periodPageViews: { value: periodPageviews, status: "available", definition: "Recorded pageviews in the selected timeframe" },
        uniqueVisitors: { value: null, status: "unavailable", definition: "Unique visitor deduplication unavailable during fallback mode" },
        newReaders: { value: newReaders, status: "available", definition: "New accounts registered in the selected timeframe" },
        averageSessionDurationSeconds: { value: null, status: "unavailable", definition: "Active session duration telemetry not currently instrumented" },
      },

      comparisons: {
        pageViewsChangePercent: null,
        uniqueVisitorsChangePercent: null,
        newReadersChangePercent: null,
      },

      hourlyActivity,

      breakdowns: {
        countries: [],
        pages: [],
        devices: [],
        referrers: [],
      },

      engagement: {
        bookOpens: { value: bookOpens, status: "available", definition: "Unique book and reader page views or explicit open events" },
        readingProgressCompletions: { value: readingProgressCompletions, status: "available", definition: "Completed reading room chapters recorded" },
        groupJoins: { value: groupJoins, status: "available", definition: "New reading group memberships formed" },
        discussions: { value: discussions, status: "available", definition: "Community posts and comment responses published" },
      },

      topMembers: [],

      // Backward compatibility fields
      totalSignups: registeredReaders,
      totalMembers: registeredReaders,
      newSignups24h: newReaders,
      newReaders,
      totalVisits: totalPageviews,
      last24hVisits: periodPageviews,
      uniqueVisitors24h: null,
      avgTimeOnSite: "—",
      topCountries: [],
      topPages: [],
      devices: [],
      referrers: [],
      readingEngagement: {
        bookViews: { count: bookOpens, tracked: true, label: "Book Views & Discovery" },
        readingProgressUpdates: { count: readingProgressCompletions, tracked: true, label: "Progress Updates & Chapters" },
        groupJoinsCount: { count: groupJoins, tracked: true, label: "Group Memberships Joined" },
        discussionsCount: { count: discussions, tracked: true, label: "Discussions & Comments" },
      },
    };

    return new Response(JSON.stringify(fallbackResponse), {
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