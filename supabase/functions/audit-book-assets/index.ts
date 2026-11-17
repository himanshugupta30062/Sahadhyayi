import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://sahadhyayi.com",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const MAX_BATCH = 20;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_HOSTS = [
  "supabase.co", "supabase.in", "archive.org", "gutenberg.org",
  "standardebooks.org", "openstax.org", "open.umn.edu", "doabooks.org",
  "oapen.org", "books.google.com", "googleusercontent.com",
  "openlibrary.org", "ncert.nic.in",
];

function safeUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some((d) => host === d || host.endsWith("." + d))) return null;
    return u;
  } catch { return null; }
}

async function readBounded(url: URL, range: string): Promise<{ response: Response; bytes: Uint8Array }> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: range },
    redirect: "manual",
    signal: AbortSignal.timeout(9000),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error("Redirect not followed; re-audit canonical URL");
  }
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) throw new Error("Asset exceeds verification size limit");
  const reader = response.body?.getReader();
  if (!reader) return { response, bytes: new Uint8Array() };
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Asset exceeds verification size limit");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return { response, bytes };
}

function imageDimensions(b: Uint8Array, type: string): { width: number; height: number } | null {
  if (type.includes("png") && b.length >= 24 &&
      b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { width: v.getUint32(16), height: v.getUint32(20) };
  }
  if ((type.includes("jpeg") || type.includes("jpg")) && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
      }
      if (len < 2) break;
      i += 2 + len;
    }
  }
  return null;
}

async function inspectCover(raw: unknown) {
  const url = safeUrl(raw);
  if (!url) return { checked: true, reachable: false, decodable: false, warnings: ["URL missing or host not allowlisted"] };
  try {
    const { response, bytes } = await readBounded(url, "bytes=0-262143");
    const type = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    const dims = imageDimensions(bytes, type);
    const valid = response.ok && type.startsWith("image/") && Boolean(dims);
    return {
      checked: true, reachable: response.ok, contentType: type,
      byteSize: bytes.length, decodable: valid,
      width: dims?.width, height: dims?.height,
      blankOrPlaceholder: !valid || (dims?.width === 1 && dims?.height === 1),
      warnings: valid ? [] : ["Image response could not be validated as PNG/JPEG with readable dimensions"],
    };
  } catch (e) {
    return { checked: true, reachable: false, decodable: false, warnings: [e instanceof Error ? e.message : "Image check failed"] };
  }
}

async function inspectPdf(raw: unknown) {
  const url = safeUrl(raw);
  if (!url) return { checked: true, reachable: false, signatureValid: false, parseable: false, warnings: ["URL missing or host not allowlisted"] };
  try {
    const { response, bytes } = await readBounded(url, "bytes=0-1048575");
    const type = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    const prefix = new TextDecoder("latin1").decode(bytes.slice(0, 16));
    const sample = new TextDecoder("latin1").decode(bytes);
    const signatureValid = prefix.startsWith("%PDF-");
    const pageCount = (sample.match(/\/Type\s*\/Page\b/g) || []).length;
    const parseable = signatureValid && sample.includes("%%EOF");
    return {
      checked: true, reachable: response.ok, contentType: type,
      signatureValid, parseable, pageCount: pageCount || undefined,
      textExtractable: /\bBT\b/.test(sample),
      encrypted: /\/Encrypt\b/.test(sample),
      warnings: parseable ? ["Structural sample only; full PDF parser/render and title-author matching are pending"] : ["PDF signature, EOF marker or response invalid"],
    };
  } catch (e) {
    return { checked: true, reachable: false, signatureValid: false, parseable: false, warnings: [e instanceof Error ? e.message : "PDF check failed"] };
  }
}

function scoreCover(e: any): number {
  if (!e.reachable || !e.decodable || e.blankOrPlaceholder) return 0;
  let s = 35;
  if (e.contentType?.startsWith("image/")) s += 10;
  if ((e.width || 0) >= 300 && (e.height || 0) >= 450) s += 15;
  else if ((e.width || 0) >= 150 && (e.height || 0) >= 225) s += 7;
  if ((e.byteSize || 0) >= 12000) s += 10;
  return Math.min(70, s);
}
function scorePdf(e: any): number {
  if (!e.reachable || !e.signatureValid || !e.parseable || e.encrypted) return 0;
  return Math.min(70, 35 + (e.contentType === "application/pdf" ? 10 : 0) +
    ((e.pageCount || 0) >= 10 ? 15 : (e.pageCount || 0) > 0 ? 5 : 0) +
    (e.textExtractable ? 10 : 0));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405, headers: cors });

  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token === auth) return Response.json({ error: "Authentication required" }, { status: 401, headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return Response.json({ error: "Server configuration incomplete" }, { status: 500, headers: cors });
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user || user.app_metadata?.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403, headers: cors });
  }

  let body: { limit?: number; book_ids?: string[] } = {};
  try { body = await req.json(); } catch { /* empty body is valid */ }
  const limit = Math.max(1, Math.min(MAX_BATCH, Number(body.limit) || 10));
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let query = admin.from("books_library")
    .select("id,title,author,cover_image_url,pdf_url")
    .order("created_at", { ascending: true }).limit(limit);
  if (Array.isArray(body.book_ids) && body.book_ids.length) query = query.in("id", body.book_ids.slice(0, MAX_BATCH));
  else query = query.or("asset_quality_status.eq.pending,asset_quality_checked_at.is.null");
  const { data: books, error } = await query;
  if (error) return Response.json({ error: "Unable to load audit batch", detail: error.message }, { status: 500, headers: cors });

  const results = [];
  for (const book of books || []) {
    const [cover, pdf] = await Promise.all([inspectCover(book.cover_image_url), inspectPdf(book.pdf_url)]);
    const coverScore = scoreCover(cover);
    const pdfScore = scorePdf(pdf);
    const evidence = {
      checkedAt: new Date().toISOString(), verifierVersion: 1,
      cover, pdf,
      identity: { status: "not_checked", reason: "OCR/vision title-author comparison is a separate review stage" },
    };
    const overall = Math.round((coverScore + pdfScore) / 2);
    // Structural checks alone never confer verified status. Human/identity review required.
    const status = "needs_review";
    const { error: updateError } = await admin.from("books_library").update({
      cover_quality_score: coverScore,
      pdf_quality_score: pdfScore,
      asset_quality_score: overall,
      asset_quality_status: status,
      asset_quality_evidence: evidence,
      asset_quality_checked_at: evidence.checkedAt,
      asset_quality_version: 1,
    }).eq("id", book.id);
    results.push({ id: book.id, title: book.title, coverScore, pdfScore, overall, status, error: updateError?.message });
  }
  return Response.json({ processed: results.length, results }, { headers: cors });
});
