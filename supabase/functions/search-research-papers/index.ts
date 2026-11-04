import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responseCache = new Map<string, { expiresAt: number; payload: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const CATEGORY_CACHE_TTL_MS = 10 * 60 * 1000;
type ResearchCategory = { slug: string; openalex_types: unknown };
let categoryCache: { expiresAt: number; rows: ResearchCategory[] } | null = null;

async function getResearchCategories(): Promise<ResearchCategory[]> {
  if (categoryCache && categoryCache.expiresAt > Date.now()) return categoryCache.rows;
  if (categoryCache) {
    try {
      const url = Deno.env.get("SUPABASE_URL");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!url || !anonKey) throw new Error("Research category database configuration is missing.");
      const query = new URLSearchParams({ select: "slug,openalex_types" });
      const response = await fetch(`${url.replace(/\\/$/, "")}/rest/v1/research_paper_categories?${query.toString()}`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Research category lookup failed with HTTP ${response.status}.`);
      const rows = await response.json() as ResearchCategory[];
      if (!Array.isArray(rows) || rows.length === 0) throw new Error("Research categories are not configured.");
      categoryCache = { rows, expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS };
      return rows;
    } catch (error) {
      console.warn("Unable to refresh research category taxonomy; using stale taxonomy.", error);
      return categoryCache.rows;
    }
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Research category database configuration is missing.");
  const query = new URLSearchParams({ select: "slug,openalex_types" });
  const response = await fetch(`${url.replace(/\\/$/, "")}/rest/v1/research_paper_categories?${query.toString()}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Research category lookup failed with HTTP ${response.status}.`);
  const rows = await response.json() as ResearchCategory[];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Research categories are not configured.");
  categoryCache = { rows, expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS };
  return rows;
}

const SELECT_FIELDS = [
  "id", "doi", "display_name", "title", "publication_year", "publication_date",
  "type", "cited_by_count", "authorships", "primary_location", "best_oa_location",
  "open_access", "abstract_inverted_index",
].join(",");

function jsonResponse(body: unknown, status = 200, cacheHit = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
      "X-Research-Cache": cacheHit ? "HIT" : "MISS",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let stalePayload: unknown = null;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "A valid JSON request body is required." }, 400);
    }

    const input = body as Record<string, unknown>;
    const query = typeof input.query === "string" ? input.query.trim().slice(0, 200) : "";
    const page = Number.isInteger(input.page) ? Number(input.page) : 1;
    const perPage = Number.isInteger(input.perPage) ? Number(input.perPage) : 12;
    const year = input.year === "all" || input.year == null ? "all" : String(input.year);
    // Keep compatibility with previously deployed frontends that still send "type".
    const requestedCategory = input.category ?? input.type;
    const category = typeof requestedCategory === "string" ? requestedCategory.trim() : "all";

    if (page < 1 || page > 10000) return jsonResponse({ error: "Page must be between 1 and 10,000." }, 400);
    if (perPage < 1 || perPage > 25) return jsonResponse({ error: "Page size must be between 1 and 25." }, 400);
    if (year !== "all" && !/^\d{4}$/.test(year)) return jsonResponse({ error: "Publication year is invalid." }, 400);

    const filters = ["open_access.is_oa:true"];
    if (year !== "all") filters.push(`publication_year:${year}`);
    if (category !== "all") {
      const categories = await getResearchCategories();
      const selected = categories.find((item) => item.slug === category);
      if (!selected || !Array.isArray(selected.openalex_types)) {
        return jsonResponse({ error: "Choose a valid research category.", code: "INVALID_CATEGORY" }, 400);
      }
      const types = selected.openalex_types.filter((value): value is string =>
        typeof value === "string" && /^[a-z0-9-]+$/.test(value),
      );
      if (types.length === 0) return jsonResponse({ error: "This category has no searchable work types.", code: "EMPTY_CATEGORY" }, 400);
      filters.push(`type:${types.join("|")}`);
    }

    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      sort: "cited_by_count:desc",
      filter: filters.join(","),
      select: SELECT_FIELDS,
    });
    if (query) params.set("search", query);

    const cacheKey = JSON.stringify({ query, page, perPage, year, category });
    const cached = responseCache.get(cacheKey);
    if (cached) stalePayload = cached.payload;
    if (cached && cached.expiresAt > Date.now()) {
      return jsonResponse(cached.payload, 200, true);
    }
    // Keep expired entries available as a fallback while refreshing upstream.

    const apiKey = Deno.env.get("OPENALEX_API_KEY");
    const mailto = Deno.env.get("OPENALEX_MAILTO");
    if (apiKey) params.set("api_key", apiKey);
    if (mailto) params.set("mailto", mailto);

    const upstream = await fetch(`https://api.openalex.org/works?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": "SahadhyayiResearch/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (upstream.status === 429) {
      if (cached) {
        console.warn("OpenAlex rate limited; serving stale research results");
        return jsonResponse(cached.payload, 200, true);
      }
      return jsonResponse({ error: "The research catalogue is busy. Please retry shortly.", code: "RATE_LIMITED", retryAfter: upstream.headers.get("retry-after") }, 429);
    }
    if (!upstream.ok) {
      console.error("OpenAlex request failed", upstream.status);
      if (cached) return jsonResponse(cached.payload, 200, true);
      return jsonResponse({ error: "The research catalogue is temporarily unavailable.", code: "UPSTREAM_ERROR" }, 502);
    }

    const payload: unknown = await upstream.json();
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as Record<string, unknown>).results)) {
      return jsonResponse({ error: "The research provider returned an unexpected response.", code: "INVALID_UPSTREAM_RESPONSE" }, 502);
    }
    if (responseCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = responseCache.keys().next().value;
      if (oldestKey) responseCache.delete(oldestKey);
    }
    responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
    return jsonResponse(payload);
  } catch (error) {
    if (stalePayload) {
      console.warn("Research search failed; serving stale cached results");
      return jsonResponse(stalePayload, 200, true);
    }
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return jsonResponse({ error: "The research catalogue took too long to respond. Please try again.", code: "UPSTREAM_TIMEOUT" }, 504);
    }
    console.error("search-research-papers failed", error);
    return jsonResponse({ error: "Unable to search research papers right now." }, 500);
  }
});
