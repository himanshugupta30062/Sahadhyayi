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
function stripTags(value: string): string {
  const raw = String(value ?? "");
  let result = "";
  let inTag = false;
  let inWhitespace = true;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === "<") {
      const tail = raw.slice(i, i + 8).toLowerCase();
      if (tail.startsWith("<script")) {
        const closeIdx = raw.toLowerCase().indexOf("</script>", i);
        if (closeIdx !== -1) {
          i = closeIdx + 8;
          continue;
        }
      } else if (tail.startsWith("<style")) {
        const closeIdx = raw.toLowerCase().indexOf("</style>", i);
        if (closeIdx !== -1) {
          i = closeIdx + 7;
          continue;
        }
      }
      inTag = true;
      if (!inWhitespace && result.length > 0) {
        result += " ";
        inWhitespace = true;
      }
    } else if (char === ">") {
      inTag = false;
      if (!inWhitespace && result.length > 0) {
        result += " ";
        inWhitespace = true;
      }
    } else if (!inTag) {
      if (char <= " ") {
        if (!inWhitespace && result.length > 0) {
          result += " ";
          inWhitespace = true;
        }
      } else {
        result += char;
        inWhitespace = false;
      }
    }
  }
  return decode(result.trim());
}

function extractTitle(html: string): string {
  const lower = html.toLowerCase();
  const startTag = lower.indexOf("<title");
  if (startTag === -1) return "";
  const endTag = lower.indexOf(">", startTag);
  if (endTag === -1) return "";
  const closeTag = lower.indexOf("</title>", endTag);
  if (closeTag === -1) return "";
  return stripTags(html.slice(endTag + 1, closeTag));
}

function extractAnchors(html: string, limit = 150): Array<{ href: string; label: string }> {
  const anchors: Array<{ href: string; label: string }> = [];
  const lower = html.toLowerCase();
  let cursor = 0;

  while (cursor < html.length && anchors.length < limit) {
    const aStart = lower.indexOf("<a", cursor);
    if (aStart === -1) break;
    const nextChar = lower[aStart + 2];
    if (nextChar && nextChar > " " && nextChar !== "/" && nextChar !== ">") {
      cursor = aStart + 2;
      continue;
    }

    const openTagEnd = lower.indexOf(">", aStart);
    if (openTagEnd === -1) break;

    const closeTag = lower.indexOf("</a>", openTagEnd);
    if (closeTag === -1) break;

    const nextA = lower.indexOf("<a", aStart + 2);
    if (nextA !== -1 && nextA < closeTag) {
      cursor = nextA;
      continue;
    }

    const tagAttrs = html.slice(aStart, openTagEnd);
    const innerContent = html.slice(openTagEnd + 1, closeTag);
    cursor = closeTag + 4;

    const hrefMatch = tagAttrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const rawHref = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "") : "";
    if (rawHref) {
      anchors.push({ href: rawHref, label: stripTags(innerContent) });
    }
  }

  return anchors;
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
    const pageTitle = extractTitle(html) || source.pathname;
    const resources: Array<{ title: string; url: string; kind: string }> = [];
    const seen = new Set<string>();
    const anchors = extractAnchors(html, 150);
    for (const anchor of anchors) {
      const href = decode(anchor.href.trim());
      const label = anchor.label.slice(0, 240);
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
