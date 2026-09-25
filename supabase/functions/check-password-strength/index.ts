// Supabase Edge Function: check-password-strength
//
// Security fix for the "People can choose a password that is already leaked" finding.
//
// The client sends only the SHA-1 hash prefix (5 hex chars) and suffix of the
// candidate password, computed locally with WebCrypto. We query the
// Have I Been Pwned k-anonymity "Pwned Passwords" range API with the prefix and
// compare the suffix server-side. The raw password never leaves the client,
// and the full hash is never transmitted in either direction.
//
// Deploy with:
//   supabase functions deploy check-password-strength --no-verify-jwt
//
// Invoke from the browser:
//   POST /functions/v1/check-password-strength
//   body: { "sha1Prefix": "0B8E2", "sha1Suffix": "CC3A4..." }
//   response: { "leaked": true|false, "count": number|null }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface CheckPayload {
  sha1Prefix?: string;
  sha1Suffix?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Basic shape validation so we never forward arbitrary strings upstream.
const PREFIX_RE = /^[0-9a-fA-F]{5}$/;
const SUFFIX_RE = /^[0-9a-fA-F]{35}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const payload: CheckPayload = await req.json();
    const prefix = (payload.sha1Prefix ?? "").toUpperCase();
    const suffix = (payload.sha1Suffix ?? "").toUpperCase();

    if (!PREFIX_RE.test(prefix) || !SUFFIX_RE.test(suffix)) {
      return json(
        {
          error:
            "Invalid request. Expected sha1Prefix (5 hex chars) and sha1Suffix (35 hex chars).",
        },
        400,
      );
    }

    // k-anonymity range query against the Pwned Passwords dataset.
    const res = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      { headers: { "Add-Padding": "true" } },
    );

    if (!res.ok) {
      // Surface a clear error so the caller can retry instead of silently
      // accepting a possibly-breached password.
      return json(
        { error: "Password leak service unavailable. Please try again." },
        502,
      );
    }

    const body = await res.text();
    let leaked = false;
    let count: number | null = null;

    for (const line of body.split("\n")) {
      const [hashSuffix, cnt] = line.trim().split(":");
      if (!hashSuffix) continue;
      if (hashSuffix.toUpperCase() === suffix) {
        leaked = true;
        count = Number.parseInt(cnt ?? "0", 10) || 0;
        break;
      }
    }

    return json({ leaked, count });
  } catch (error) {
    console.error("check-password-strength error:", error);
    return json({ error: "Failed to check password" }, 500);
  }
});
