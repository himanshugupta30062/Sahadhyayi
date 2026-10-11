import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    return Response.json({ error: "Community pulse is unavailable" }, { status: 503, headers: corsHeaders });
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("get_public_community_pulse");
  if (error || !data) {
    console.error("Community pulse query failed:", error?.message);
    return Response.json({ error: "Community pulse is unavailable" }, { status: 503, headers: corsHeaders });
  }

  // The public response contains reading-community aggregates only. Visitor,
  // device, referrer, country, and visitor-level data are private to admins.
  return Response.json(data, { headers: { ...corsHeaders, "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
});