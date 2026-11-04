import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responseCache = new Map<string, { expiresAt: number; payload: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

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
    const allowedCategories = new Set(["article", "review", "preprint", "conference-paper", "book-chapter", "other"]);
    const category = typeof input.category === "string" && allowedCategories.has(input.category) ? input.category : "all";
    const categoryFilters: Record<string, string> = {
      article: "type:article",
      review: "type:review",
      preprint: "type:preprint",
      "conference-paper": "primary_location.source.type:conference",
      "book-chapter": "type:book-chapter",
      other: "type:other",
    };

    if (page < 1 || page > 10000) return jsonResponse({ error: "Page must be between 1 and 10,000." }, 400);
    if (perPage < 1 || perPage > 25) return jsonResponse({ error: "Page size must be between 1 and 25." }, 400);
    if (year !== "all" && !/^\d{4}$/.test(year)) return jsonResponse({ error: "Publication year is invalid." }, 400);

    const filters = ["open_access.is_oa:true"];
    if (year !== "all") filters.push(`publication_year:${year}`);
    if (category !== "all") filters.push(categoryFilters[category]);

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
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return jsonResponse({ error: "The research catalogue took too long to respond. Please try again.", code: "UPSTREAM_TIMEOUT" }, 504);
    }
    console.error("search-research-papers failed", error);
    return jsonResponse({ error: "Unable to search research papers right now." }, 500);
  }
});
