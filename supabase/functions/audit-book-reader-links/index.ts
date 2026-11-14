import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-audit-secret" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("POST required", { status: 405, headers: cors });
  const secret = Deno.env.get("BOOK_LINK_AUDIT_SECRET");
  if (!secret || req.headers.get("x-audit-secret") !== secret) return new Response("Unauthorized", { status: 401, headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);
  const offset = Math.max(Number(body.offset) || 0, 0);
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const response = await fetch(`${supabaseUrl}/rest/v1/books_library?select=id,title,pdf_url&order=title.asc&limit=${limit}&offset=${offset}`, { headers });
  if (!response.ok) return new Response(await response.text(), { status: 500, headers: cors });

  const books = await response.json();
  const results = [];
  for (const book of books) {
    const raw = (book.pdf_url || "").trim();
    let status = "no_source", httpStatus: number | null = null, contentType: string | null = null;
    let note = "No reading URL is configured";
    if (raw) {
      try {
        const parsed = new URL(raw);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsafe URL protocol");
        if (parsed.hostname.includes("books.google.")) {
          const id = parsed.searchParams.get("id");
          if (!id) throw new Error("Google Books URL has no volume id");
          const check = await fetch(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(9000) });
          httpStatus = check.status; contentType = check.headers.get("content-type");
          if (check.ok) {
            const volume = await check.json();
            status = volume.accessInfo?.viewability === "ALL_PAGES" ? "working" : "preview_only";
            note = status === "working" ? "Google Books reports all pages viewable" : "Google Books preview/restricted; full access not guaranteed";
          } else {
            status = check.status === 404 ? "broken" : "restricted";
            note = `Google Books API returned ${check.status}`;
          }
        } else {
          let check = await fetch(raw, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(9000) });
          if (!check.ok || check.status === 405 || check.status === 403) {
            check = await fetch(raw, { headers: { Range: "bytes=0-1023" }, redirect: "follow", signal: AbortSignal.timeout(9000) });
          }
          httpStatus = check.status; contentType = check.headers.get("content-type");
          if (check.ok) {
            const pdf = /application\/pdf/i.test(contentType || "") ||
              /\.pdf(?:$|[?#])/i.test(new URL(check.url).pathname) || new URL(check.url).hostname === "archive.org";
            status = pdf ? "working" : "restricted";
            note = pdf ? "Source responds; PDF bytes should be validated by reader" : "Source responds but content is not clearly a PDF";
          } else {
            status = check.status === 404 || check.status === 410 ? "broken" : "restricted";
            note = `Source returned HTTP ${check.status}`;
          }
        }
      } catch (error) {
        status = "restricted"; note = error instanceof Error ? error.message : "Network/source error";
      }
    }
    const update = await fetch(`${supabaseUrl}/rest/v1/books_library?id=eq.${book.id}`, {
      method: "PATCH", headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ reader_link_status: status, reader_link_checked_at: new Date().toISOString(),
        reader_link_http_status: httpStatus, reader_link_content_type: contentType, reader_link_note: note })
    });
    results.push({ id: book.id, title: book.title, status, httpStatus, note, updated: update.ok });
  }
  return new Response(JSON.stringify({ offset, processed: results.length, results, nextOffset: offset + results.length }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
});
