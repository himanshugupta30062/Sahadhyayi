import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function stripTags(value: string) {
  return decode(value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function allowedHost(host: string) {
  return host === "myherupa.com" || host === "www.myherupa.com";
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST required." }, 405);
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Sign in as an administrator." }, 401);
    const url = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !anon || !service) return json({ error: "Server configuration is incomplete." }, 503);
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth.user) return json({ error: "Your session is invalid. Sign in again." }, 401);
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: role, error: roleError } = await admin.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) return json({ error: "Administrator access required." }, 403);

    const body = await req.json().catch(() => ({}));
    if (body.action !== "discover") return json({ error: "Unsupported action." }, 400);
    if (typeof body.url !== "string" || body.url.length > 2048) return json({ error: "Provide a valid myHerupa URL." }, 400);
    let source: URL;
    try { source = new URL(body.url); } catch { return json({ error: "The source URL is invalid." }, 400); }
    if (source.protocol !== "https:" || !allowedHost(source.hostname)) return json({ error: "Only HTTPS pages on myherupa.com are allowed." }, 400);

    // Follow only same-site redirects. Validate each Location before issuing
    // another request so a compromised page cannot turn this fetcher into an SSRF proxy.
    let requestUrl = source;
    let response: Response | null = null;
    for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
      response = await fetch(requestUrl.toString(), {
        headers: { "User-Agent": "SahadhyayiLibraryImporter/1.0 (+https://sahadhyayi.com)" },
        signal: AbortSignal.timeout(15000),
        redirect: "manual",
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location || redirectCount === 3) return json({ error: "The source page has an unsupported redirect." }, 502);
      const nextUrl = new URL(location, requestUrl);
      if (nextUrl.protocol !== "https:" || !allowedHost(nextUrl.hostname)) {
        return json({ error: "The source redirected outside myherupa.com." }, 400);
      }
      requestUrl = nextUrl;
    }
    if (!response || !response.ok) return json({ error: `myHerupa returned HTTP ${response?.status || 502}.` }, 502);
    const finalUrl = requestUrl;
    const html = (await response.text()).slice(0, 1_500_000);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? stripTags(titleMatch[1]) : source.pathname;
    const resources: Array<{ title: string; url: string; kind: string }> = [];
    const seen = new Set<string>();
    const anchorPattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = anchorPattern.exec(html)) !== null && resources.length < 150) {
      const href = decode(match[1].trim());
      const label = stripTags(match[2]).slice(0, 240);
      if (!href || href.startsWith("#") || /^javascript:/i.test(href) || !label) continue;
      let resolved: URL;
      try { resolved = new URL(href, finalUrl); } catch { continue; }
      if (resolved.protocol !== "https:" && resolved.protocol !== "http:") continue;
      const lower = (label + " " + resolved.hostname + resolved.pathname).toLowerCase();
      const isResource = /book|lab material|pdf|drive\.google|docs\.google|dropbox|resource|textbook|ebook|e-book/.test(lower);
      if (!isResource || seen.has(resolved.toString())) continue;
      seen.add(resolved.toString());
      const kind = /drive\.google|docs\.google/.test(resolved.hostname) ? "Google Drive resource"
        : /pdf/.test(lower) ? "PDF link" : /book|textbook|ebook|e-book/.test(lower) ? "Book/resource page" : "Course material";
      resources.push({ title: label, url: resolved.toString(), kind });
    }
    return json({ success: true, pageTitle, sourceUrl: finalUrl.toString(), resources });
  } catch (error) {
    console.error("myHerupa importer discovery failed", error);
    return json({ error: error instanceof Error ? error.message : "Source discovery failed." }, 500);
  }
});
