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

    const fetchActionAnalytics = async (): Promise<Record<string, unknown> | null> => {
      try {
        const { data, error } = await supabase.rpc("get_community_pulse_action_stats", {
          p_timeframe: timeframe,
        });
        if (error || !data || typeof data !== "object") return null;
        return data as Record<string, unknown>;
      } catch {
        return null;
      }
    };

    // 2. Invoke the authoritative server-side PostgreSQL aggregation RPC
    const { data: rpcStats, error: rpcError } = await supabase.rpc("get_community_pulse_stats", {
      p_timeframe: timeframe,
    });

    if (!rpcError && rpcStats && typeof rpcStats === "object") {
      // City aggregates live in a separate, privacy-conscious RPC so the main
      // visitor aggregate remains focused on traffic, devices, pages and engagement.
      let responseStats = rpcStats as Record<string, unknown>;
      const [cityResult, actionAnalytics] = await Promise.all([
        supabase.rpc("get_community_pulse_city_stats", { p_timeframe: timeframe }),
        fetchActionAnalytics(),
      ]);
      const cityStats = cityResult.data;
      const cityStatsError = cityResult.error;

      responseStats = {
        ...responseStats,
        topCities: !cityStatsError && cityStats && typeof cityStats === "object" && Array.isArray((cityStats as Record<string, unknown>).topCities)
          ? (cityStats as Record<string, unknown>).topCities
          : [],
        mostVisitedCity24h: !cityStatsError && cityStats && typeof cityStats === "object"
          ? (cityStats as Record<string, unknown>).mostVisitedCity24h ?? null
          : null,
        actionAnalytics,
        partialData: Boolean(responseStats.partialData || !actionAnalytics),
      };
      if (actionAnalytics && typeof actionAnalytics.averageSessionDurationSeconds === "number") {
        responseStats.avgTimeOnSite = actionAnalytics.averageSessionDurationSeconds;
      }

      return new Response(JSON.stringify(responseStats), {
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

    // Optional aggregates are independently fetched so one missing RPC does not block core stats.
    let cityStats: Record<string, unknown> = {};
    try {
      const { data, error } = await supabase.rpc("get_community_pulse_city_stats", {
        p_timeframe: timeframe,
      });
      if (!error && data && typeof data === "object") {
        cityStats = data as Record<string, unknown>;
      }
    } catch {
      // Keep the response explicitly partial if city aggregation is not deployed yet.
    }
    const actionAnalytics = await fetchActionAnalytics();

    const registeredReaders = totalSignupsRes.error ? null : totalSignupsRes.count;
    const newReaders = newSignupsPeriodRes.error ? null : newSignupsPeriodRes.count;
    const totalPageviews = totalPageviewsRes.error ? null : totalPageviewsRes.count;
    const periodPageviews = periodPageviewsRes.error ? null : periodPageviewsRes.count;

    // If the aggregate RPC is unavailable, try exact per-hour counts instead
    // of presenting an all-zero chart as if it were measured traffic.
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: true,
    });

    const hourlyBuckets = await Promise.all(
      Array.from({ length: 24 }, async (_, i) => {
        const bucketStart = new Date(now - (24 - i) * 3600 * 1000);
        const bucketEnd = new Date(now - (23 - i) * 3600 * 1000);
        const { count, error } = await supabase
          .from("website_visits")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "pageview")
          .gte("visited_at", bucketStart.toISOString())
          .lt("visited_at", bucketEnd.toISOString());

        if (error || typeof count !== "number") return null;
        return {
          hourIndex: i,
          bucketStart: bucketStart.toISOString(),
          label: formatter.format(bucketStart),
          pageViews: count,
          count,
          isPeak: false,
        };
      }),
    );

    const hourlyActivity = hourlyBuckets.every((bucket) => bucket !== null)
      ? hourlyBuckets.filter((bucket): bucket is NonNullable<typeof bucket> => bucket !== null)
      : [];
    const hourlyPeak = Math.max(0, ...hourlyActivity.map((bucket) => bucket.count));
    for (const bucket of hourlyActivity) {
      bucket.isPeak = hourlyPeak > 0 && bucket.count === hourlyPeak;
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

    const bookOpens = bookOpensRes.error ? null : bookOpensRes.count;
    const readingProgressCompletions = progressRes.error ? null : progressRes.count;
    const groupJoins = groupJoinsRes.error ? null : groupJoinsRes.count;
    const discussions = postsRes.error || commentsRes.error || postsRes.count == null || commentsRes.count == null
      ? null
      : postsRes.count + commentsRes.count;

    const fallbackResponse = {
      schemaVersion: 2,
      timeframe,
      partialData: true,
      fallbackMode: "partial",
      periodStart: timeframeStart,
      periodEnd,
      lastUpdated: new Date().toISOString(),
      freshness: "fresh",

      metrics: {
        registeredReaders: { value: registeredReaders, status: registeredReaders === null ? "unavailable" : "available", definition: "Authoritative count of registered reader accounts" },
        totalPageViews: { value: totalPageviews, status: totalPageviews === null ? "unavailable" : "available", definition: "Total recorded pageviews across platform lifetime" },
        periodPageViews: { value: periodPageviews, status: periodPageviews === null ? "unavailable" : "available", definition: "Recorded pageviews in the selected timeframe" },
        uniqueVisitors: { value: null, status: "unavailable", definition: "Unique visitor deduplication unavailable during fallback mode" },
        newReaders: { value: newReaders, status: newReaders === null ? "unavailable" : "available", definition: "New accounts registered in the selected timeframe" },
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
        bookOpens: { value: bookOpens, status: bookOpens === null ? "unavailable" : "available", definition: "Unique book and reader page views or explicit open events" },
        readingProgressCompletions: { value: readingProgressCompletions, status: readingProgressCompletions === null ? "unavailable" : "available", definition: "Completed reading room chapters recorded" },
        groupJoins: { value: groupJoins, status: groupJoins === null ? "unavailable" : "available", definition: "New reading group memberships formed" },
        discussions: { value: discussions, status: discussions === null ? "unavailable" : "available", definition: "Community posts and comment responses published" },
      },

      topMembers: [],
      topCities: Array.isArray(cityStats.topCities) ? cityStats.topCities : [],
      mostVisitedCity24h: cityStats.mostVisitedCity24h ?? null,
      actionAnalytics,

      // This fallback deliberately marks unaggregated details as unavailable.
      // Do not invent country/page/device/referrer distributions when the SQL aggregate fails.

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