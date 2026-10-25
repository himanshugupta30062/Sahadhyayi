import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { getBearerToken, hasDeleteConfirmation } from "./validation.ts";

const allowedOrigins = new Set([
  "https://www.sahadhyayi.com",
  "https://sahadhyayi.com",
]);

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin)
    ? origin
    : "https://www.sahadhyayi.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
  Vary: "Origin",
});

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req.headers.get("Origin")) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, req.headers.get("Origin"));
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Account deletion is missing required server configuration.");
    return json({ error: "Account deletion is temporarily unavailable. Please try again later." }, 503, req.headers.get("Origin"));
  }

  const authorization = req.headers.get("Authorization");
  const token = getBearerToken(authorization);
  if (!token) {
    return json({ error: "Please sign in again before deleting your account." }, 401, req.headers.get("Origin"));
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: authData, error: authError } = await callerClient.auth.getUser(token);
    if (authError || !authData.user) {
      return json({ error: "Your session is invalid or expired. Please sign in again." }, 401, req.headers.get("Origin"));
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body." }, 400, req.headers.get("Origin"));
    }

    if (!hasDeleteConfirmation(body)) {
      return json({ error: "Explicit DELETE confirmation is required." }, 400, req.headers.get("Origin"));
    }

    // Never accept a user ID from the client. The target is always the identity
    // resolved from the verified access token.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authData.user.id);
    if (deleteError) {
      console.error("Authenticated account deletion failed:", deleteError.message);
      return json({ error: "We could not delete your account. Please try again or contact support." }, 500, req.headers.get("Origin"));
    }

    return json({ success: true }, 200, req.headers.get("Origin"));
  } catch (error) {
    console.error("Unexpected account deletion error:", error);
    return json({ error: "Account deletion failed unexpectedly. Please try again." }, 500, req.headers.get("Origin"));
  }
});
