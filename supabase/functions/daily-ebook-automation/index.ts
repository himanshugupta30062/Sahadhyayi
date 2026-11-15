import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_BOOKS_PER_RUN = 5; // Limit to 5 new books per run
const PDF_VERIFY_BYTES = 2048; // First 2KB for header check

interface BookCandidate {
  title: string;
  author: string;
  source: "gutenberg" | "internet_archive" | "open_library";
  pdf_url: string;
  epub_url?: string;
  cover_url?: string;
  publication_year?: number;
  language?: string;
  subjects?: string[];
  description?: string;
  gutenberg_id?: number;
  archive_id?: string;
  openlibrary_key?: string;
  isbn?: string;
}

interface AuthorProfile {
  name: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  biography?: string;
  wikipedia_url?: string;
  portrait_url?: string;
  genres?: string[];
  notable_works?: string[];
}

interface AutomationLog {
  run_id: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed" | "partial";
  books_discovered: number;
  books_verified: number;
  books_inserted: number;
  books_skipped_duplicate: number;
  books_skipped_existing: number;
  authors_enriched: number;
  errors: string[];
  warnings: string[];
  details: {
    discovered: BookCandidate[];
    verified: BookCandidate[];
    inserted: { id: string; title: string }[];
    skipped: { title: string; author: string; reason: string }[];
    authors: { id: string; name: string }[];
  };
}

interface PDFMetadata {
  sha256: string;
  size: number;
  pageCount: number | null;
  valid: boolean;
}

function generateRunId(): string {
  return `ebook-auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Compute SHA-256 hash of a blob
 */
async function computeSHA256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Download PDF and compute SHA-256, validate structure
 */
async function fetchAndValidatePDF(pdfUrl: string): Promise<{ blob: Blob | null; metadata: PDFMetadata; error?: string }> {
  try {
    // HEAD request first to check content-type and size
    const headResponse = await fetch(pdfUrl, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    if (!headResponse.ok) {
      return { blob: null, metadata: { sha256: "", size: 0, pageCount: null, valid: false }, error: `HTTP ${headResponse.status}` };
    }

    const contentLength = headResponse.headers.get("content-length");
    const size = contentLength ? Number.parseInt(contentLength, 10) : 0;

    if (size > MAX_PDF_SIZE) {
      return { blob: null, metadata: { sha256: "", size, pageCount: null, valid: false }, error: `PDF too large: ${size} bytes` };
    }

    // GET the full PDF (for SHA-256 and validation)
    const getResponse = await fetch(pdfUrl, { signal: AbortSignal.timeout(60000) });
    if (!getResponse.ok) {
      return { blob: null, metadata: { sha256: "", size, pageCount: null, valid: false }, error: `PDF download failed: ${getResponse.status}` };
    }

    const blob = await getResponse.blob();
    const actualSize = blob.size;

    // Verify PDF signature
    const headerBuffer = await blob.slice(0, 5).arrayBuffer();
    const header = new TextDecoder().decode(new Uint8Array(headerBuffer));
    if (header !== "%PDF-") {
      return { blob, metadata: { sha256: "", size: actualSize, pageCount: null, valid: false }, error: "Invalid PDF signature" };
    }

    // Compute SHA-256
    const sha256 = await computeSHA256(blob);

    // Validate PDF structure (trailer, page count)
    let pageCount: number | null = null;
    try {
      const trailerStart = Math.max(0, actualSize - 2048);
      const trailerBuffer = await blob.slice(trailerStart, actualSize).arrayBuffer();
      const trailer = new TextDecoder().decode(new Uint8Array(trailerBuffer));

      if (trailer.includes("startxref") && trailer.includes("%%EOF")) {
        const countMatch = trailer.match(/\/Count\s+(\d+)/);
        if (countMatch) {
          pageCount = Number.parseInt(countMatch[1], 10);
        }
      }
    } catch {
      // Ignore page count extraction errors
    }

    return {
      blob,
      metadata: { sha256, size: actualSize, pageCount, valid: true }
    };
  } catch (error) {
    return { blob: null, metadata: { sha256: "", size: 0, pageCount: null, valid: false }, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

/**
 * Check if PDF already exists in library by SHA-256
 */
async function checkDuplicateBySHA256(supabase: any, sha256: string): Promise<{ exists: boolean; bookId?: string }> {
  const { data, error } = await supabase
    .from("books_library")
    .select("id, title")
    .eq("pdf_sha256", sha256)
    .maybeSingle();

  if (error) {
    console.error("SHA-256 duplicate check error:", error);
    return { exists: false };
  }

  return { exists: !!data, bookId: data?.id };
}

/**
 * Check if book already exists using the match_catalogue_book RPC
 */
async function checkExistingBook(supabase: any, title: string, author: string, isbn?: string): Promise<{ exists: boolean; bookId?: string; matchScore?: number }> {
  try {
    const { data, error } = await supabase.rpc("match_catalogue_book", {
      p_title: title,
      p_author: author,
      p_isbn: isbn || null,
      p_limit: 3,
    });

    if (error) {
      console.error("Catalogue match RPC error:", error);
      return { exists: false };
    }

    const matches = (data || []) as Array<Record<string, unknown>>;
    if (matches.length > 0) {
      const topMatch = matches[0];
      const score = typeof topMatch.match_score === "number" ? topMatch.match_score : 0;
      // High confidence match (exact title + author or ISBN)
      if (score >= 2.0 || (isbn && topMatch.isbn === isbn)) {
        return { exists: true, bookId: topMatch.id as string, matchScore: score };
      }
    }

    return { exists: false };
  } catch (error) {
    console.error("Existing book check failed:", error);
    return { exists: false };
  }
}

async function fetchGutenbergBooks(): Promise<BookCandidate[]> {
  try {
    const url = "https://gutendex.com/books/?languages=en&mime_type=application/pdf&sort=popular&limit=50";
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .map((book: any) => {
        const formats = book.formats || {};
        const pdf = formats["application/pdf"] || formats["text/pdf"];
        const epub = formats["application/epub+zip"];
        const cover = formats["image/jpeg"] || formats["image/png"];

        if (!pdf) return null;

        return {
          title: (book.title || "").trim(),
          author: book.authors?.[0]?.name ? normalizeGutenbergAuthor(book.authors[0].name) : "Unknown",
          source: "gutenberg" as const,
          pdf_url: pdf,
          epub_url: epub,
          cover_url: cover,
          publication_year: book.authors?.[0]?.death_year ? Number.parseInt(book.authors[0].death_year) - 40 : undefined,
          language: book.languages?.[0] === "en" ? "English" : book.languages?.[0],
          subjects: book.subjects || [],
          description: book.summaries?.[0],
          gutenberg_id: book.id,
        };
      })
      .filter((b: BookCandidate | null): b is BookCandidate => b !== null && b.title.length > 0);
  } catch (error) {
    console.error("Gutenberg fetch error:", error);
    return [];
  }
}

function normalizeGutenbergAuthor(raw: string): string {
  if (!raw) return "Unknown";
  if (raw.includes(",")) {
    const parts = raw.split(",").map((p) => p.trim());
    if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  }
  return raw.trim();
}

async function fetchInternetArchiveBooks(): Promise<BookCandidate[]> {
  try {
    const url = "https://archive.org/advancedsearch.php?q=mediatype:texts+AND+collection:(gutenberg)+AND+format:pdf&fl=identifier,title,creator,date,description,subject,publicdate&rows=50&output=json&sort=publicdate desc";
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.response?.docs || !Array.isArray(data.response.docs)) return [];

    const results: BookCandidate[] = [];
    for (const item of data.response.docs.slice(0, 30)) {
      const id = item.identifier;
      if (!id) continue;

      const pdfUrl = await getVerifiedArchivePdfUrl(id);
      if (!pdfUrl) continue;

      results.push({
        title: (item.title || "").trim(),
        author: Array.isArray(item.creator) ? item.creator[0] : (item.creator || "Unknown"),
        source: "internet_archive",
        pdf_url: pdfUrl,
        cover_url: `https://archive.org/services/img/${id}`,
        publication_year: item.date ? Number.parseInt(item.date.split("-")[0]) : undefined,
        language: "English",
        subjects: Array.isArray(item.subject) ? item.subject : item.subject ? [item.subject] : [],
        description: Array.isArray(item.description) ? item.description[0] : item.description,
        archive_id: id,
      });
    }
    return results;
  } catch (error) {
    console.error("Internet Archive fetch error:", error);
    return [];
  }
}

async function getVerifiedArchivePdfUrl(identifier: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return undefined;

    const item = await response.json();
    const files = Array.isArray(item.files) ? item.files : [];

    const pdf = files.find((file: any) =>
      typeof file.name === "string" &&
      file.name.toLowerCase().endsWith(".pdf") &&
      file.private !== "true" &&
      file.private !== true &&
      !file.name.toLowerCase().includes("_text.pdf") &&
      !file.name.toLowerCase().includes("_jp2.zip")
    );

    if (!pdf) return undefined;
    if (item.metadata?.access === "restricted" || item.metadata?.is_dark === true || item.metadata?.is_private === true) return undefined;

    const encodedPath = pdf.name.split("/").map(encodeURIComponent).join("/");
    return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodedPath}`;
  } catch {
    return undefined;
  }
}

async function fetchOpenLibraryBooks(): Promise<BookCandidate[]> {
  try {
    const url = "https://openlibrary.org/search.json?q=public+domain&has_fulltext=true&limit=50&fields=key,title,author_name,first_publish_year,subject,language,cover_i,ia,ebook_access,isbn";
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    const results: BookCandidate[] = [];
    for (const book of data.docs.slice(0, 30)) {
      const iaId = Array.isArray(book.ia) ? book.ia[0] : book.ia;
      if (!iaId) continue;

      const pdfUrl = await getVerifiedArchivePdfUrl(iaId);
      if (!pdfUrl) continue;

      const isbn = Array.isArray(book.isbn) ? book.isbn[0] : book.isbn;

      results.push({
        title: (book.title || "").trim(),
        author: Array.isArray(book.author_name) ? book.author_name[0] : (book.author_name || "Unknown"),
        source: "open_library",
        pdf_url: pdfUrl,
        cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined,
        publication_year: book.first_publish_year,
        language: Array.isArray(book.language) ? (book.language[0] === "eng" ? "English" : book.language[0]) : "English",
        subjects: Array.isArray(book.subject) ? book.subject.slice(0, 5) : [],
        openlibrary_key: book.key,
        isbn: isbn?.replace(/[^0-9X]/gi, "").slice(0, 17),
      });
    }
    return results;
  } catch (error) {
    console.error("Open Library fetch error:", error);
    return [];
  }
}

async function enrichAuthorData(authorName: string): Promise<AuthorProfile | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(authorName)}&format=json&srlimit=1`;
    const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const page = searchData.query?.search?.[0];
    if (!page) return null;

    const pageId = page.pageid;
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&pageids=${pageId}&format=json`;
    const detailResponse = await fetch(detailUrl, { signal: AbortSignal.timeout(5000) });
    if (!detailResponse.ok) return null;

    const detailData = await detailResponse.json();
    const pageData = detailData.query?.pages?.[pageId];
    if (!pageData) return null;

    const extract = pageData.extract || "";
    const birthMatch = extract.match(/born\s+([^.\n]+)/i);
    const deathMatch = extract.match(/died\s+([^.\n]+)/i);

    const wikidataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${pageData.wikibase_item || ""}.json`;
    let birthDate: string | undefined;
    let deathDate: string | undefined;
    let birthPlace: string | undefined;
    let deathPlace: string | undefined;
    const genres: string[] = [];
    const notableWorks: string[] = [];

    if (pageData.wikibase_item) {
      try {
        const wdResponse = await fetch(wikidataUrl, { signal: AbortSignal.timeout(5000) });
        if (wdResponse.ok) {
          const wdData = await wdResponse.json();
          const entity = wdData.entities?.[pageData.wikibase_item];
          if (entity) {
            const birthClaim = entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
            if (birthClaim) birthDate = birthClaim.replace(/^\+/, "").split("T")[0];

            const deathClaim = entity.claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time;
            if (deathClaim) deathDate = deathClaim.replace(/^\+/, "").split("T")[0];

            const birthPlaceId = entity.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id;
            if (birthPlaceId) {
              const placeUrl = `https://www.wikidata.org/wiki/Special:EntityData/${birthPlaceId}.json`;
              const placeResp = await fetch(placeUrl, { signal: AbortSignal.timeout(3000) });
              if (placeResp.ok) {
                const placeData = await placeResp.json();
                birthPlace = placeData.entities?.[birthPlaceId]?.labels?.en?.value;
              }
            }

            const deathPlaceId = entity.claims?.P20?.[0]?.mainsnak?.datavalue?.value?.id;
            if (deathPlaceId) {
              const placeUrl = `https://www.wikidata.org/wiki/Special:EntityData/${deathPlaceId}.json`;
              const placeResp = await fetch(placeUrl, { signal: AbortSignal.timeout(3000) });
              if (placeResp.ok) {
                const placeData = await placeResp.json();
                deathPlace = placeData.entities?.[deathPlaceId]?.labels?.en?.value;
              }
            }

            const genreClaims = entity.claims?.P136 || [];
            for (const claim of genreClaims.slice(0, 5)) {
              const genreId = claim.mainsnak?.datavalue?.value?.id;
              if (genreId) {
                const genreUrl = `https://www.wikidata.org/wiki/Special:EntityData/${genreId}.json`;
                const genreResp = await fetch(genreUrl, { signal: AbortSignal.timeout(3000) });
                if (genreResp.ok) {
                  const genreData = await genreResp.json();
                  const label = genreData.entities?.[genreId]?.labels?.en?.value;
                  if (label) genres.push(label);
                }
              }
            }

            const workClaims = entity.claims?.P800 || [];
            for (const claim of workClaims.slice(0, 5)) {
              const workId = claim.mainsnak?.datavalue?.value?.id;
              if (workId) {
                const workUrl = `https://www.wikidata.org/wiki/Special:EntityData/${workId}.json`;
                const workResp = await fetch(workUrl, { signal: AbortSignal.timeout(3000) });
                if (workResp.ok) {
                  const workData = await workResp.json();
                  const label = workData.entities?.[workId]?.labels?.en?.value;
                  if (label) notableWorks.push(label);
                }
              }
            }
          }
        }
      } catch (wdError) {
        console.warn("Wikidata enrichment failed:", wdError);
      }
    }

    return {
      name: authorName,
      birth_date: birthDate || (birthMatch ? birthMatch[1].trim() : undefined),
      death_date: deathDate || (deathMatch ? deathMatch[1].trim() : undefined),
      birth_place: birthPlace,
      death_place: deathPlace,
      biography: extract.slice(0, 2000),
      wikipedia_url: pageData.fullurl,
      portrait_url: pageData.original?.source,
      genres: genres.length > 0 ? genres : undefined,
      notable_works: notableWorks.length > 0 ? notableWorks : undefined,
    };
  } catch (error) {
    console.error(`Author enrichment failed for ${authorName}:`, error);
    return null;
  }
}

async function upsertBook(supabase: any, book: BookCandidate, authorId: string, pdfMetadata: PDFMetadata): Promise<{ id: string } | null> {
  const bookData = {
    title: book.title,
    author: book.author,
    genre: book.subjects?.join(", "),
    pdf_url: book.pdf_url,
    cover_image_url: book.cover_url,
    publication_year: book.publication_year,
    language: book.language,
    description: book.description,
    pdf_sha256: pdfMetadata.sha256,
    pdf_file_size: pdfMetadata.size,
    pdf_page_count: pdfMetadata.pageCount,
    pdf_verification_status: "verified",
    pdf_last_validated: new Date().toISOString(),
    status: "active",
    catalog_status: "active",
    is_archived: false,
    // Store source metadata
    gutenberg_id: book.gutenberg_id,
    archive_id: book.archive_id,
    openlibrary_key: book.openlibrary_key,
    isbn: book.isbn,
  };

  const { data, error } = await supabase
    .from("books_library")
    .insert(bookData)
    .select("id")
    .single();

  if (error) {
    // Check if it's a duplicate key error on pdf_sha256
    if (error.code === "23505" && error.message?.includes("pdf_sha256")) {
      console.log(`Book "${book.title}" skipped: PDF already exists in library (SHA-256 duplicate)`);
      return null;
    }
    console.error("Book insert error:", error);
    return null;
  }
  return { id: data.id };
}

async function upsertAuthor(supabase: any, profile: AuthorProfile): Promise<{ id: string } | null> {
  const { data: existing } = await supabase
    .from("authors")
    .select("id")
    .ilike("name", profile.name)
    .maybeSingle();

  const authorData = {
    name: profile.name,
    bio: profile.biography,
    profile_image_url: profile.portrait_url,
    location: profile.birth_place || "Unknown",
    website_url: profile.wikipedia_url,
    social_links: {
      wikipedia: profile.wikipedia_url,
      wikidata: profile.wikipedia_url?.replace("wikipedia.org", "wikidata.org"),
    },
    genres: profile.genres || [],
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("authors")
      .update(authorData)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      console.error("Author update error:", error);
      return null;
    }
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("authors")
    .insert(authorData)
    .select("id")
    .single();

  if (error) {
    console.error("Author insert error:", error);
    return null;
  }
  return { id: data.id };
}

async function logAutomationRun(supabase: any, log: AutomationLog): Promise<void> {
  try {
    await supabase.from("automation_runs").insert({
      run_id: log.run_id,
      started_at: log.started_at,
      completed_at: log.completed_at,
      status: log.status,
      books_discovered: log.books_discovered,
      books_verified: log.books_verified,
      books_inserted: log.books_inserted,
      books_skipped_duplicate: log.books_skipped_duplicate,
      books_skipped_existing: log.books_skipped_existing,
      authors_enriched: log.authors_enriched,
      errors: log.errors,
      warnings: log.warnings,
      details: log.details,
    });
  } catch (error) {
    console.log("Automation run log:", JSON.stringify(log, null, 2));
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const runId = generateRunId();
  const startedAt = new Date().toISOString();

  const log: AutomationLog = {
    run_id: runId,
    started_at: startedAt,
    status: "running",
    books_discovered: 0,
    books_verified: 0,
    books_inserted: 0,
    books_skipped_duplicate: 0,
    books_skipped_existing: 0,
    authors_enriched: 0,
    errors: [],
    warnings: [],
    details: {
      discovered: [],
      verified: [],
      inserted: [],
      skipped: [],
      authors: [],
    },
  };

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    return json({ error: "Supabase configuration missing" }, 503);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    console.log(`[${runId}] Starting daily ebook automation...`);

    // Step 1: Discover candidate books from all sources
    console.log(`[${runId}] Discovering books from Project Gutenberg...`);
    const gutenbergBooks = await fetchGutenbergBooks();

    console.log(`[${runId}] Discovering books from Internet Archive...`);
    const archiveBooks = await fetchInternetArchiveBooks();

    console.log(`[${runId}] Discovering books from Open Library...`);
    const openLibraryBooks = await fetchOpenLibraryBooks();

    const allCandidates = [...gutenbergBooks, ...archiveBooks, ...openLibraryBooks];
    log.books_discovered = allCandidates.length;
    log.details.discovered = allCandidates.map(b => ({ title: b.title, author: b.author, source: b.source }));

    console.log(`[${runId}] Discovered ${allCandidates.length} candidate books`);

    // Step 2: Filter out books that already exist in our library (using RPC + SHA-256)
    const newCandidates: Array<{ candidate: BookCandidate; pdfMetadata: PDFMetadata }> = [];

    for (const candidate of allCandidates) {
      try {
        // First check via catalogue matching RPC
        const existingCheck = await checkExistingBook(supabase, candidate.title, candidate.author, candidate.isbn);
        if (existingCheck.exists) {
          log.books_skipped_existing++;
          log.details.skipped.push({
            title: candidate.title,
            author: candidate.author,
            reason: `Already in catalogue (match score: ${existingCheck.matchScore?.toFixed(1)})`
          });
          console.log(`[${runId}] ⊘ Skipped (exists in catalogue): ${candidate.title} by ${candidate.author}`);
          continue;
        }

        // Download and validate PDF, compute SHA-256
        console.log(`[${runId}] Downloading and validating: ${candidate.title}`);
        const { blob, metadata, error } = await fetchAndValidatePDF(candidate.pdf_url);

        if (error || !blob || !metadata.valid) {
          log.errors.push(`PDF validation failed for "${candidate.title}": ${error || "Invalid PDF"}`);
          console.log(`[${runId}] ✗ Validation failed: ${candidate.title} - ${error}`);
          continue;
        }

        // Check SHA-256 duplicate
        const dupCheck = await checkDuplicateBySHA256(supabase, metadata.sha256);
        if (dupCheck.exists) {
          log.books_skipped_duplicate++;
          log.details.skipped.push({
            title: candidate.title,
            author: candidate.author,
            reason: `PDF content already exists (SHA-256 duplicate)`
          });
          console.log(`[${runId}] ⊘ Skipped (SHA-256 duplicate): ${candidate.title}`);
          continue;
        }

        newCandidates.push({ candidate, pdfMetadata: metadata });
        log.books_verified++;
        log.details.verified.push({ title: candidate.title, author: candidate.author, source: candidate.source });
        console.log(`[${runId}] ✓ Verified: ${candidate.title} (SHA-256: ${metadata.sha256.slice(0, 16)}...)`);
      } catch (error) {
        log.errors.push(`Error processing "${candidate.title}": ${error instanceof Error ? error.message : "Unknown error"}`);
        console.error(`[${runId}] Error processing ${candidate.title}:`, error);
      }
    }

    console.log(`[${runId}] ${newCandidates.length} new candidates after deduplication (${log.books_skipped_existing} existing, ${log.books_skipped_duplicate} SHA-256 duplicates)`);

    // Step 3: Process verified books - enrich authors and insert (limit to MAX_BOOKS_PER_RUN)
    const processedAuthors = new Set<string>();
    const toProcess = newCandidates.slice(0, MAX_BOOKS_PER_RUN);

    for (const { candidate, pdfMetadata } of toProcess) {
      try {
        // Enrich author data
        if (!processedAuthors.has(candidate.author.toLowerCase())) {
          console.log(`[${runId}] Enriching author: ${candidate.author}`);
          const authorProfile = await enrichAuthorData(candidate.author);

          if (authorProfile) {
            const authorResult = await upsertAuthor(supabase, authorProfile);
            if (authorResult) {
              log.authors_enriched++;
              log.details.authors.push({ id: authorResult.id, name: authorProfile.name });
              processedAuthors.add(candidate.author.toLowerCase());
              console.log(`[${runId}] ✓ Author enriched: ${candidate.author}`);
            }
          }
        }

        // Find author_id if exists
        let authorId: string | null = null;
        const { data: authorData } = await supabase
          .from("authors")
          .select("id")
          .ilike("name", candidate.author)
          .maybeSingle();

        if (authorData) authorId = authorData.id;

        // Insert book with PDF metadata
        const bookResult = await upsertBook(supabase, candidate, authorId || "", pdfMetadata);
        if (bookResult) {
          log.books_inserted++;
          log.details.inserted.push({ id: bookResult.id, title: candidate.title });
          console.log(`[${runId}] ✓ Book inserted: ${candidate.title} (ID: ${bookResult.id})`);
        } else {
          // Book was not inserted (likely duplicate SHA-256 caught at DB level)
          log.books_skipped_duplicate++;
          log.details.skipped.push({
            title: candidate.title,
            author: candidate.author,
            reason: "Insert failed (likely duplicate)"
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        log.errors.push(`Failed to insert "${candidate.title}": ${errorMsg}`);
        console.error(`[${runId}] Failed to insert ${candidate.title}:`, error);
      }
    }

    // Determine final status
    if (log.errors.length > 0 && log.books_inserted === 0) {
      log.status = "failed";
    } else if (log.errors.length > 0) {
      log.status = "partial";
    } else {
      log.status = "completed";
    }

    log.completed_at = new Date().toISOString();

    await logAutomationRun(supabase, log);

    console.log(`[${runId}] Automation ${log.status}. Books: ${log.books_inserted}, Authors: ${log.authors_enriched}, Skipped: ${log.books_skipped_existing + log.books_skipped_duplicate}, Errors: ${log.errors.length}`);

    return json({
      success: log.status !== "failed",
      run_id: runId,
      status: log.status,
      summary: {
        discovered: log.books_discovered,
        verified: log.books_verified,
        inserted: log.books_inserted,
        skipped_existing: log.books_skipped_existing,
        skipped_duplicate: log.books_skipped_duplicate,
        authors_enriched: log.authors_enriched,
        errors: log.errors.length,
        warnings: log.warnings.length,
      },
      details: log.details,
      errors: log.errors,
      warnings: log.warnings,
    });

  } catch (error) {
    log.status = "failed";
    log.completed_at = new Date().toISOString();
    log.errors.push(error instanceof Error ? error.message : "Unknown error");

    await logAutomationRun(supabase, log);

    console.error(`[${runId}] Automation failed:`, error);
    return json({ error: "Automation failed", run_id: runId, details: log }, 500);
  }
});