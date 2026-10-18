import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validUuid = (value: unknown): string | null =>
  typeof value === "string" && UUID_RE.test(value) ? value : null;

function safePagePath(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "/";
  try {
    const parsed = new URL(value.trim().slice(0, 1000), "https://www.sahadhyayi.com");
    if (!["sahadhyayi.com", "www.sahadhyayi.com"].includes(parsed.hostname.toLowerCase())) return "/";
    return (parsed.pathname || "/").slice(0, 200);
  } catch {
    return "/";
  }
}

function safeReferrerHost(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.slice(0, 200) || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" };
  // Preview builds share Supabase credentials but must not pollute production traffic metrics.
  const origin = req.headers.get("origin");
  if (origin) {
    let normalizedOrigin = "";
    try { normalizedOrigin = new URL(origin).origin; } catch { normalizedOrigin = ""; }
    if (!["https://sahadhyayi.com", "https://www.sahadhyayi.com"].includes(normalizedOrigin)) {
      return new Response(JSON.stringify({ error: "Analytics accepts events only from the production site" }), { status: 403, headers });
    }
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const length = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > 8000) {
    return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Analytics service unavailable" }), { status: 503, headers });
    }

    let body: {
      page_url?: string;
      event_id?: string;
      visitor_id?: string;
      session_id?: string;
      referrer?: string;
    } = {};
    try {
      const input = await req.json();
      if (input && typeof input === "object" && !Array.isArray(input)) body = input;
    } catch {
      // Empty/malformed bodies are handled as a visit to the root path.
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || forwardedFor || null;
    const countryCode = (
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("x-nf-country") ||
      ""
    ).toUpperCase().slice(0, 2) || null;

    const record = {
      event_id: validUuid(body.event_id) || crypto.randomUUID(),
      event_type: "pageview",
      event_name: null,
      visitor_id: validUuid(body.visitor_id),
      session_id: validUuid(body.session_id),
      ip_address: realIp && !["0.0.0.0", "127.0.0.1", "::1"].includes(realIp) ? realIp.slice(0, 100) : null,
      user_agent: (req.headers.get("user-agent") || "Unknown").slice(0, 500),
      page_url: safePagePath(body.page_url),
      country_code: countryCode,
      referrer: safeReferrerHost(body.referrer),
      metadata: {},
    };

    const { error: insertError } = await supabase
      .from("website_visits")
      .upsert(record, { onConflict: "event_id", ignoreDuplicates: true });

    if (insertError) {
      console.error("Legacy visit insert failed:", insertError.code || "database_error");
      return new Response(JSON.stringify({ error: "Failed to record visit" }), { status: 500, headers });
    }

    const { count, error: countError } = await supabase
      .from("website_visits")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "pageview");
    if (countError) {
      console.error("Pageview count query failed:", countError.code || "database_error");
      return new Response(JSON.stringify({ error: "Failed to count pageviews" }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ totalVisits: count, eventType: "pageview" }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Legacy website-clicks endpoint failed:", error instanceof Error ? error.message : "unknown_error");
    return new Response(JSON.stringify({ error: "Failed to record visit" }), { status: 500, headers });
  }
});
