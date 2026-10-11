import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    return Response.json({ error: "Community stats unavailable" }, { status: 503, headers: corsHeaders });
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  try {
    // Parse timeframe (default: 24h; options: 24h, 7d, 30d)
    let timeframe = "24h";
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (body?.timeframe) timeframe = body.timeframe;
      } else {
        const urlObj = new URL(req.url);
        if (urlObj.searchParams.get("timeframe")) {
          timeframe = urlObj.searchParams.get("timeframe")!;
        }
      }
    } catch {
      timeframe = "24h";
    }

    const now = Date.now();
    let timeframeHours = 24;
    if (timeframe === "7d") timeframeHours = 7 * 24;
    else if (timeframe === "30d") timeframeHours = 30 * 24;

    const timeframeStart = new Date(now - timeframeHours * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // 1. Total Signups & New Signups in period
    let totalSignups = 0;
    let newSignupsPeriod = 0;
    try {
      const [{ count: totalProfilesCount }, { count: newProfilesCount }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      ]);
      totalSignups = totalProfilesCount || 0;
      newSignupsPeriod = newProfilesCount || 0;
    } catch {
      // fallback
    }

    if (totalSignups === 0) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (usersData?.users) {
          totalSignups = usersData.users.length;
          newSignupsPeriod = usersData.users.filter((u: any) => new Date(u.created_at).getTime() >= (now - timeframeHours * 3600000)).length;
        }
      } catch {
        // ignore
      }
    }

    // 2. Visits metrics
    const { data: visitsRpc } = await supabase.rpc("get_website_visit_count");
    const totalVisits = Number(visitsRpc) || 0;

    // Period visits & unique visitors
    const { data: periodVisitRows } = await supabase
      .from("website_visits")
      .select("visitor_id, session_id, ip_address, visited_at, city, region, country_code, event_name, page_url")
      .gte("visited_at", timeframeStart)
      .limit(10000);

    const periodVisits = periodVisitRows ? periodVisitRows.length : 0;

    // Deduplicate unique visitors
    const uniqueVisitorKeys = new Set<string>();
    for (const row of periodVisitRows || []) {
      const key = row.visitor_id || row.session_id || row.ip_address;
      if (key) uniqueVisitorKeys.add(String(key));
    }
    const uniqueVisitorsPeriod = uniqueVisitorKeys.size > 0 ? uniqueVisitorKeys.size : periodVisits;

    // 3. Hourly activity for the last 24 hours (24 compact bars)
    // Query 24h visits explicitly for the hourly distribution
    const { data: last24hVisitsRows } = await supabase
      .from("website_visits")
      .select("visited_at")
      .gte("visited_at", twentyFourHoursAgo)
      .limit(10000);

    const hourlyCounts = new Array(24).fill(0);
    const hourlyLabels = new Array(24).fill("");

    // Align buckets: hour 0 is 23 hours ago, hour 23 is current hour
    for (let i = 0; i < 24; i++) {
      const d = new Date(now - (23 - i) * 60 * 60 * 1000);
      const hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      hourlyLabels[i] = `${h12} ${ampm}`;
    }

    if (last24hVisitsRows && last24hVisitsRows.length > 0) {
      for (const row of last24hVisitsRows) {
        if (!row.visited_at) continue;
        const rowTime = new Date(row.visited_at).getTime();
        const diffHours = Math.floor((now - rowTime) / (60 * 60 * 1000));
        if (diffHours >= 0 && diffHours < 24) {
          const bucketIndex = 23 - diffHours;
          if (bucketIndex >= 0 && bucketIndex < 24) {
            hourlyCounts[bucketIndex]++;
          }
        }
      }
    }

    const peakVisitCount = Math.max(...hourlyCounts, 0);
    const hourlyActivity = hourlyCounts.map((count, index) => ({
      hourIndex: index,
      label: hourlyLabels[index],
      count,
      isPeak: count > 0 && count === peakVisitCount,
    }));

    // 4. City activity in period
    const cityCountsMap: Record<string, number> = {};
    const cityCounts24hMap: Record<string, number> = {};

    for (const row of periodVisitRows || []) {
      if (row.city && row.city !== "Unknown") {
        const label = row.region ? `${row.city}, ${row.region}` : row.city;
        cityCountsMap[label] = (cityCountsMap[label] || 0) + 1;
        if (new Date(row.visited_at).getTime() >= (now - 24 * 3600000)) {
          cityCounts24hMap[label] = (cityCounts24hMap[label] || 0) + 1;
        }
      }
    }

    const sortedCities = Object.entries(cityCountsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        count24h: cityCounts24hMap[name] || count,
      }));

    const mostActiveCity = sortedCities.length > 0 ? sortedCities[0] : null;

    // 5. Country activity
    const countryCountsMap: Record<string, number> = {};
    for (const row of periodVisitRows || []) {
      if (row.country_code) {
        countryCountsMap[row.country_code] = (countryCountsMap[row.country_code] || 0) + 1;
      }
    }

    let topCountries = Object.entries(countryCountsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    if (topCountries.length === 0) {
      try {
        const { data: rpcCountries } = await supabase.rpc("get_top_visitor_countries", { limit_count: 10 });
        if (rpcCountries) {
          topCountries = rpcCountries.map((r: any) => ({ code: r.country_code, count: Number(r.visit_count) }));
        }
      } catch {
        // ignore
      }
    }

    // 6. Top Community Members (Ranked by legitimate engagement events)
    // Points: post = 5, comment = 3, reading room message = 2, chapter completed = 4
    const userEngagement: Record<string, {
      userId: string;
      posts: number;
      comments: number;
      messages: number;
      chapters: number;
      totalPoints: number;
      totalActions: number;
    }> = {};

    const trackAction = (userId: string | null, type: "posts" | "comments" | "messages" | "chapters", pts: number) => {
      if (!userId) return;
      if (!userEngagement[userId]) {
        userEngagement[userId] = {
          userId,
          posts: 0,
          comments: 0,
          messages: 0,
          chapters: 0,
          totalPoints: 0,
          totalActions: 0,
        };
      }
      userEngagement[userId][type]++;
      userEngagement[userId].totalPoints += pts;
      userEngagement[userId].totalActions++;
    };

    try {
      const [
        { data: postRows },
        { data: commentRows },
        { data: roomMsgRows },
        { data: roomEventRows },
      ] = await Promise.all([
        supabase.from("posts").select("user_id").gte("created_at", timeframeStart).limit(1000),
        supabase.from("post_comments").select("user_id").gte("created_at", timeframeStart).limit(1000),
        supabase.from("reading_room_messages").select("user_id").gte("created_at", timeframeStart).limit(1000),
        supabase.from("reading_room_events").select("user_id, kind").gte("created_at", timeframeStart).limit(1000),
      ]);

      for (const p of postRows || []) trackAction(p.user_id, "posts", 5);
      for (const c of commentRows || []) trackAction(c.user_id, "comments", 3);
      for (const m of roomMsgRows || []) trackAction(m.user_id, "messages", 2);
      for (const e of roomEventRows || []) {
        if (e.kind === "chapter_complete") trackAction(e.user_id, "chapters", 4);
      }
    } catch {
      // Fallback
    }

    const sortedUserIds = Object.values(userEngagement)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5);

    let topMembers: any[] = [];
    if (sortedUserIds.length > 0) {
      const ids = sortedUserIds.map((u) => u.userId);
      const { data: memberProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, profile_photo_url")
        .in("id", ids);

      const profileMap = new Map((memberProfiles || []).map((p: any) => [p.id, p]));

      topMembers = sortedUserIds.map((item, index) => {
        const profile = profileMap.get(item.userId);
        return {
          rank: index + 1,
          userId: item.userId,
          name: profile?.full_name || profile?.username || `Reader ${item.userId.slice(0, 4)}`,
          username: profile?.username || null,
          avatarUrl: profile?.profile_photo_url || null,
          activityCount: item.totalActions,
          totalPoints: item.totalPoints,
          breakdown: {
            posts: item.posts,
            comments: item.comments,
            messages: item.messages,
            chapters: item.chapters,
          },
        };
      });
    }

    // 7. Reading Engagement Metrics (Actual tracked product events)
    let bookViewsCount = 0;
    for (const row of periodVisitRows || []) {
      if (
        row.event_name === "book_opened" ||
        row.event_name === "discovery_book_opened" ||
        (row.page_url && (row.page_url.includes("/book/") || row.page_url.includes("/reader/")))
      ) {
        bookViewsCount++;
      }
    }

    let progressUpdatesCount = 0;
    try {
      const { count: progressCount } = await supabase
        .from("reading_room_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", timeframeStart);
      progressUpdatesCount = progressCount || 0;
    } catch {
      progressUpdatesCount = 0;
    }

    let roomJoinsCount = 0;
    try {
      const { count: roomsCount } = await supabase
        .from("reading_rooms")
        .select("*", { count: "exact", head: true });
      roomJoinsCount = roomsCount || 0;
    } catch {
      roomJoinsCount = 0;
    }

    let discussionsCount = 0;
    try {
      const [{ count: pCount }, { count: cCount }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).gte("created_at", timeframeStart),
      ]);
      discussionsCount = (pCount || 0) + (cCount || 0);
    } catch {
      discussionsCount = 0;
    }

    const readingEngagement = {
      bookViews: {
        count: bookViewsCount,
        tracked: true,
        label: "Book Views & Discovery",
      },
      readingProgressUpdates: {
        count: progressUpdatesCount,
        tracked: true,
        label: "Progress Updates & Chapters",
      },
      groupJoins: {
        count: roomJoinsCount,
        tracked: true,
        label: "Active Rooms & Groups",
      },
      discussions: {
        count: discussionsCount,
        tracked: true,
        label: "Discussions & Comments",
      },
    };

    const responsePayload = {
      timeframe,
      totalSignups,
      newSignups24h: newSignupsPeriod,
      totalVisits,
      last24hVisits: periodVisits,
      uniqueVisitors24h: uniqueVisitorsPeriod,
      hourlyActivity,
      peakHour: hourlyActivity.find((h) => h.isPeak) || null,
      topCountries,
      topCities: sortedCities,
      mostVisitedCity24h: mostActiveCity,
      topMembers,
      readingEngagement,
      lastUpdated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in community-stats edge function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch community statistics" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});