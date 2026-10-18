import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Vary": "Origin",
};
const JSON_HEADERS = {
  ...corsHeaders,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSIONS = 768;
const LIMITS = {
  maxBatchSize: 5,
  maxChunkCharacters: 1400,
  overlapCharacters: 180,
  maxApprovedTextCharacters: 16000,
  embeddingTimeoutMs: 12000,
};

type SourceType = "book_metadata" | "book_summary" | "approved_text" | "site_article";
type SourceItem = {
  sourceType: SourceType;
  sourceRef: string;
  bookId: string | null;
  title: string;
  author: string | null;
  sourceUrl: string | null;
  sourceLicense: string | null;
  content: string;
  metadata: Record<string, unknown>;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function chunkText(input: string): string[] {
  const text = input.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + LIMITS.maxChunkCharacters, text.length);
    if (end < text.length) {
      const lowerBound = start + Math.floor(LIMITS.maxChunkCharacters * 0.62);
      const window = text.slice(lowerBound, end);
      const boundary = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
        window.lastIndexOf("! "),
        window.lastIndexOf("। "),
        window.lastIndexOf("; "),
      );
      if (boundary >= 0) end = lowerBound + boundary + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
    start = Math.max(end - LIMITS.overlapCharacters, start + 1);
  }
  return chunks;
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIMITS.embeddingTimeoutMs);
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + EMBEDDING_MODEL + ":embedContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          content: { parts: [{ text: text.slice(0, 7800) }] },
          output_dimensionality: EMBEDDING_DIMENSIONS,
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      console.error("RAG embedding request failed with status " + response.status + ".");
      throw new Error("EMBEDDING_PROVIDER_ERROR");
    }
    const body = await response.json();
    const values = body?.embedding?.values;
    if (
      !Array.isArray(values) ||
      values.length !== EMBEDDING_DIMENSIONS ||
      !values.every((value: unknown) => typeof value === "number" && Number.isFinite(value))
    ) {
      throw new Error("EMBEDDING_RESPONSE_INVALID");
    }
    return values as number[];
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function sourceItemsFromCatalog(
  adminClient: any,
  sourceType: "book_metadata" | "book_summary",
  offset: number,
  limit: number,
): Promise<SourceItem[]> {
  if (sourceType === "book_metadata") {
    const { data, error } = await adminClient
      .from("books_library")
      .select("id,title,author,genre,description,cover_image_url,publication_year,language")
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw new Error("CATALOG_QUERY_FAILED");

    return (data ?? []).flatMap((book: any) => {
      if (!book?.id || !book?.title) return [];
      const content = [
        "Sahadhyayi library book record",
        "Title: " + book.title,
        book.author ? "Author: " + book.author : "",
        book.genre ? "Genre: " + book.genre : "",
        book.language ? "Language: " + book.language : "",
        book.publication_year ? "Publication year: " + book.publication_year : "",
        book.description ? "Description: " + book.description : "",
      ].filter(Boolean).join("\n");
      return [{
        sourceType: "book_metadata",
        sourceRef: String(book.id),
        bookId: String(book.id),
        title: String(book.title).slice(0, 240),
        author: typeof book.author === "string" ? book.author.slice(0, 160) : null,
        sourceUrl: "https://sahadhyayi.com/book/" + encodeURIComponent(String(book.id)),
        sourceLicense: null,
        content,
        metadata: {
          genre: book.genre ?? null,
          language: book.language ?? null,
          publicationYear: book.publication_year ?? null,
          hasDescription: Boolean(book.description?.trim()),
          hasCover: Boolean(book.cover_image_url?.trim()),
          sourceTable: "books_library",
        },
      }];
    });
  }

  const { data, error } = await adminClient
    .from("book_summaries")
    .select("id,book_id,summary_type,content,page_start,page_end,chapter_number,duration_minutes,books_library(title,author,genre,language)")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error("SUMMARY_QUERY_FAILED");

  return (data ?? []).flatMap((row: any) => {
    const summaryContent = typeof row?.content === "string" ? row.content.trim() : "";
    if (!row?.id || !summaryContent) return [];
    const book = Array.isArray(row.books_library) ? row.books_library[0] : row.books_library;
    const title = typeof book?.title === "string" ? book.title : "Book summary";
    const author = typeof book?.author === "string" ? book.author : null;
    const content = [
      "Sahadhyayi book summary",
      "Title: " + title,
      author ? "Author: " + author : "",
      row.summary_type ? "Summary type: " + row.summary_type : "",
      row.chapter_number ? "Chapter: " + row.chapter_number : "",
      row.page_start || row.page_end
        ? "Pages: " + (row.page_start ?? "?") + "-" + (row.page_end ?? "?")
        : "",
      summaryContent,
    ].filter(Boolean).join("\n");
    return [{
      sourceType: "book_summary",
      sourceRef: String(row.id),
      bookId: typeof row.book_id === "string" ? row.book_id : null,
      title: (title + (row.summary_type ? " — " + row.summary_type : "")).slice(0, 240),
      author: author?.slice(0, 160) ?? null,
      sourceUrl: typeof row.book_id === "string"
        ? "https://sahadhyayi.com/book/" + encodeURIComponent(row.book_id)
        : null,
      sourceLicense: null,
      content,
      metadata: {
        summaryType: row.summary_type ?? null,
        pageStart: row.page_start ?? null,
        pageEnd: row.page_end ?? null,
        chapterNumber: row.chapter_number ?? null,
        durationMinutes: row.duration_minutes ?? null,
        sourceTable: "book_summaries",
      },
    }];
  });
}

async function indexSource(
  adminClient: any,
  item: SourceItem,
  apiKey: string,
): Promise<"indexed" | "unchanged"> {
  const contentHash = await sha256(item.content);
  const { data: existing, error: existingError } = await adminClient
    .from("book_expert_documents")
    .select("id,content_sha256,ingest_status")
    .eq("source_type", item.sourceType)
    .eq("source_ref", item.sourceRef)
    .maybeSingle();
  if (existingError) throw new Error("DOCUMENT_LOOKUP_FAILED");

  if (existing?.content_sha256 === contentHash && existing.ingest_status === "indexed") {
    const { count, error: countError } = await adminClient
      .from("book_expert_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", existing.id)
      .not("embedding", "is", null);
    if (!countError && (count ?? 0) > 0) return "unchanged";
  }

  const { data: document, error: upsertError } = await adminClient
    .from("book_expert_documents")
    .upsert({
      source_type: item.sourceType,
      source_ref: item.sourceRef,
      book_id: item.bookId,
      title: item.title,
      author: item.author,
      source_url: item.sourceUrl,
      source_license: item.sourceLicense,
      content: item.content,
      content_sha256: contentHash,
      metadata: item.metadata,
      is_active: true,
      ingest_status: "processing",
      failure_reason: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "source_type,source_ref" })
    .select("id")
    .single();
  if (upsertError || !document?.id) throw new Error("DOCUMENT_UPSERT_FAILED");

  const { error: deleteError } = await adminClient
    .from("book_expert_chunks")
    .delete()
    .eq("document_id", document.id);
  if (deleteError) throw new Error("OLD_CHUNK_CLEANUP_FAILED");

  const pieces = chunkText(item.content);
  if (pieces.length === 0) throw new Error("DOCUMENT_EMPTY_AFTER_CHUNKING");

  try {
    const prepared = await mapWithConcurrency(pieces, 3, async (piece, index) => {
      const embeddingText = [
        "Title: " + item.title,
        item.author ? "Author: " + item.author : "",
        "Source type: " + item.sourceType,
        piece,
      ].filter(Boolean).join("\n");
      const embedding = await generateEmbedding(embeddingText, apiKey);
      return {
        document_id: document.id,
        chunk_index: index,
        content: piece,
        embedding,
        embedding_model: EMBEDDING_MODEL,
        content_sha256: await sha256(piece),
        metadata: {
          sourceType: item.sourceType,
          sourceRef: item.sourceRef,
          title: item.title,
          author: item.author,
          bookId: item.bookId,
          sourceUrl: item.sourceUrl,
          sourceLicense: item.sourceLicense,
          chunkIndex: index,
          ...item.metadata,
        },
      };
    });

    const { error: insertError } = await adminClient
      .from("book_expert_chunks")
      .insert(prepared);
    if (insertError) throw new Error("CHUNK_INSERT_FAILED");

    const { error: updateError } = await adminClient
      .from("book_expert_documents")
      .update({
        ingest_status: "indexed",
        indexed_at: new Date().toISOString(),
        failure_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);
    if (updateError) throw new Error("DOCUMENT_STATUS_UPDATE_FAILED");
    return "indexed";
  } catch (error) {
    await adminClient
      .from("book_expert_documents")
      .update({
        ingest_status: "failed",
        failure_reason: error instanceof Error ? error.message.slice(0, 120) : "INDEXING_FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);
    throw error;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !geminiApiKey) {
    return jsonResponse({ error: "RAG ingestion is temporarily unavailable." }, 503);
  }

  const authorization = req.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ error: "Sign in with an administrator account to index sources." }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData?.user) {
    return jsonResponse({ error: "Your session is invalid or has expired." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleError || isAdmin !== true) {
    return jsonResponse({ error: "Only Sahadhyayi administrators can index RAG content." }, 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Please provide a valid JSON request." }, 400);
  }

  const action = body?.action;
  let items: SourceItem[] = [];
  let sourceType: SourceType | null = null;

  if (action === "seed_catalog") {
    if (body.sourceType !== "book_metadata" && body.sourceType !== "book_summary") {
      return jsonResponse({ error: "sourceType must be book_metadata or book_summary." }, 400);
    }
    sourceType = body.sourceType;
    const offset = Number.isInteger(body.offset) && body.offset >= 0 ? body.offset : 0;
    const requestedLimit = Number.isInteger(body.limit) ? body.limit : LIMITS.maxBatchSize;
    const limit = Math.max(1, Math.min(LIMITS.maxBatchSize, requestedLimit));
    try {
      items = await sourceItemsFromCatalog(adminClient, sourceType, offset, limit);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "CATALOG_QUERY_FAILED";
      console.error("Book Expert RAG source query failed: " + reason);
      return jsonResponse({ error: "Could not read the selected catalog sources." }, 503);
    }
  } else if (action === "ingest_text") {
    if (body.sourceType !== "approved_text" && body.sourceType !== "site_article") {
      return jsonResponse({ error: "sourceType must be approved_text or site_article." }, 400);
    }
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const sourceRef = typeof body.sourceRef === "string" ? body.sourceRef.trim() : "";
    const text = typeof body.content === "string" ? body.content.trim() : "";
    if (!title || title.length > 240 || !/^[A-Za-z0-9:_./-]{1,180}$/.test(sourceRef)) {
      return jsonResponse({ error: "A title and a valid sourceRef are required." }, 400);
    }
    if (text.length < 80 || text.length > LIMITS.maxApprovedTextCharacters) {
      return jsonResponse({ error: "Approved source text must be between 80 and 16,000 characters per request." }, 413);
    }
    const sourceUrl = body.sourceUrl === undefined || body.sourceUrl === null || body.sourceUrl === ""
      ? null
      : safeUrl(body.sourceUrl);
    if (body.sourceUrl && !sourceUrl) {
      return jsonResponse({ error: "sourceUrl must be an HTTP(S) URL." }, 400);
    }
    const license = typeof body.sourceLicense === "string" ? body.sourceLicense.trim().slice(0, 160) : null;
    const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};
    items = [{
      sourceType: body.sourceType,
      sourceRef,
      bookId: null,
      title,
      author: typeof body.author === "string" ? body.author.trim().slice(0, 160) : null,
      sourceUrl,
      sourceLicense: license,
      content: text,
      metadata,
    }];
    sourceType = body.sourceType;
  } else {
    return jsonResponse({ error: "Unknown action. Use seed_catalog or ingest_text." }, 400);
  }

  const summary = {
    sourceType,
    requested: items.length,
    indexed: 0,
    unchanged: 0,
    failed: 0,
    failures: [] as Array<{ sourceRef: string; reason: string }>,
  };
  for (const item of items) {
    try {
      const result = await indexSource(adminClient, item, geminiApiKey);
      if (result === "indexed") summary.indexed += 1;
      else summary.unchanged += 1;
    } catch (error) {
      summary.failed += 1;
      const reason = error instanceof Error ? error.message : "INDEXING_FAILED";
      summary.failures.push({ sourceRef: item.sourceRef, reason: reason.slice(0, 120) });
      console.error("Book Expert RAG source failed: " + item.sourceType + " / " + reason);
    }
  }

  return jsonResponse({
    success: summary.failed === 0,
    ...summary,
    nextOffset: action === "seed_catalog" ? (Number.isInteger(body.offset) && body.offset >= 0 ? body.offset : 0) + items.length : null,
    batchSizeLimit: LIMITS.maxBatchSize,
    embeddingModel: EMBEDDING_MODEL,
    embeddingDimensions: EMBEDDING_DIMENSIONS,
  }, summary.failed === items.length && items.length > 0 ? 502 : 200);
});
