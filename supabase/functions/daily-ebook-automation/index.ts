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
  status: "running" | "completed" | "failed";
  books_discovered: number;
  books_verified: number;
  books_inserted: number;
  authors_enriched: number;
  errors: string[];
  details: {
    discovered: BookCandidate[];
    verified: BookCandidate[];
    inserted: { id: string; title: string }[];
    authors: { id: string; name: string }[];
  };
}

function generateRunId(): string {
  return `ebook-auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchGutenbergBooks(): Promise<BookCandidate[]> {
  try {
    // Fetch recently added/public domain books from Project Gutenberg
    // Using the Gutendex API - get books with PDF format
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
    // Search for public domain texts with PDF availability
    const url = "https://archive.org/advancedsearch.php?q=mediatype:texts+AND+collection:(gutenberg)+AND+format:pdf&fl=identifier,title,creator,date,description,subject,publicdate&rows=50&output=json&sort=publicdate desc";
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.response?.docs || !Array.isArray(data.response.docs)) return [];

    const results: BookCandidate[] = [];
    for (const item of data.response.docs.slice(0, 30)) {
      const id = item.identifier;
      if (!id) continue;

      // Get verified PDF URL
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

    // Find the main PDF (not _text.pdf or _jp2.zip)
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
    // Search for public domain books with PDF/ebook availability
    const url = "https://openlibrary.org/search.json?q=public+domain&has_fulltext=true&limit=50&fields=key,title,author_name,first_publish_year,subject,language,cover_i,ia,ebook_access";
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    const results: BookCandidate[] = [];
    for (const book of data.docs.slice(0, 30)) {
      // Check if it has Internet Archive ID for PDF access
      const iaId = Array.isArray(book.ia) ? book.ia[0] : book.ia;
      if (!iaId) continue;

      const pdfUrl = await getVerifiedArchivePdfUrl(iaId);
      if (!pdfUrl) continue;

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
      });
    }
    return results;
  } catch (error) {
    console.error("Open Library fetch error:", error);
    return [];
  }
}

async function verifyPdfUrl(pdfUrl: string): Promise<{ valid: boolean; error?: string; contentType?: string; size?: number }> {
  try {
    // HEAD request first to check content-type and size
    const headResponse = await fetch(pdfUrl, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    if (!headResponse.ok) {
      return { valid: false, error: `HTTP ${headResponse.status}` };
    }

    const contentType = headResponse.headers.get("content-type") || "";
    const contentLength = headResponse.headers.get("content-length");
    const size = contentLength ? Number.parseInt(contentLength, 10) : undefined;

    if (size && size > MAX_PDF_SIZE) {
      return { valid: false, error: `PDF too large: ${size} bytes` };
    }

    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      // Some servers don't set proper content-type, allow but verify with GET
      console.warn(`Unexpected content-type for ${pdfUrl}: ${contentType}`);
    }

    // GET first 2KB to verify PDF signature
    const getResponse = await fetch(pdfUrl, {
      headers: { Range: `bytes=0-${PDF_VERIFY_BYTES - 1}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!getResponse.ok) {
      return { valid: false, error: `PDF download failed: ${getResponse.status}` };
    }

    const buffer = await getResponse.arrayBuffer();
    const header = new Uint8Array(buffer).slice(0, 5);
    const headerStr = new TextDecoder().decode(header);

    if (headerStr !== "%PDF-") {
      return { valid: false, error: "Invalid PDF signature" };
    }

    return { valid: true, contentType, size };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Verification failed" };
  }
}

async function enrichAuthorData(authorName: string): Promise<AuthorProfile | null> {
  try {
    // Use Wikipedia API to get author info
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(authorName)}&format=json&srlimit=1`;
    const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const page = searchData.query?.search?.[0];
    if (!page) return null;

    // Get detailed page info
    const pageId = page.pageid;
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=true&explaintext=true&piprop=original&inprop=url&pageids=${pageId}&format=json`;
    const detailResponse = await fetch(detailUrl, { signal: AbortSignal.timeout(5000) });
    if (!detailResponse.ok) return null;

    const detailData = await detailResponse.json();
    const pageData = detailData.query?.pages?.[pageId];
    if (!pageData) return null;

    // Parse infobox for birth/death dates (basic extraction from extract)
    const extract = pageData.extract || "";
    const birthMatch = extract.match(/born\s+([^.\n]+)/i);
    const deathMatch = extract.match(/died\s+([^.\n]+)/i);

    // Try to get structured data from Wikidata
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
            // Birth date (P569)
            const birthClaim = entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
            if (birthClaim) birthDate = birthClaim.replace(/^\+/, "").split("T")[0];

            // Death date (P570)
            const deathClaim = entity.claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time;
            if (deathClaim) deathDate = deathClaim.replace(/^\+/, "").split("T")[0];

            // Place of birth (P19)
            const birthPlaceId = entity.claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id;
            if (birthPlaceId) {
              const placeUrl = `https://www.wikidata.org/wiki/Special:EntityData/${birthPlaceId}.json`;
              const placeResp = await fetch(placeUrl, { signal: AbortSignal.timeout(3000) });
              if (placeResp.ok) {
                const placeData = await placeResp.json();
                birthPlace = placeData.entities?.[birthPlaceId]?.labels?.en?.value;
              }
            }

            // Place of death (P20)
            const deathPlaceId = entity.claims?.P20?.[0]?.mainsnak?.datavalue?.value?.id;
            if (deathPlaceId) {
              const placeUrl = `https://www.wikidata.org/wiki/Special:EntityData/${deathPlaceId}.json`;
              const placeResp = await fetch(placeUrl, { signal: AbortSignal.timeout(3000) });
              if (placeResp.ok) {
                const placeData = await placeResp.json();
                deathPlace = placeData.entities?.[deathPlaceId]?.labels?.en?.value;
              }
            }

            // Genre (P136)
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

            // Notable works (P800)
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

async function upsertBook(supabase: any, book: BookCandidate, authorId: string): Promise<{ id: string } | null> {
  // Check if book already exists (by title + author)
  const { data: existing } = await supabase
    .from("books_library")
    .select("id")
    .ilike("title", book.title)
    .ilike("author", book.author)
    .maybeSingle();

  if (existing) {
    // Update existing book with new PDF URL if needed
    const { data, error } = await supabase
      .from("books_library")
      .update({
        pdf_url: book.pdf_url,
        cover_image_url: book.cover_url,
        genre: book.subjects?.join(", "),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      console.error("Book update error:", error);
      return null;
    }
    return { id: data.id };
  }

  // Insert new book
  const { data, error } = await supabase
    .from("books_library")
    .insert({
      title: book.title,
      author: book.author,
      genre: book.subjects?.join(", "),
      pdf_url: book.pdf_url,
      cover_image_url: book.cover_url,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Book insert error:", error);
    return null;
  }
  return { id: data.id };
}

async function upsertAuthor(supabase: any, profile: AuthorProfile): Promise<{ id: string } | null> {
  // Check if author exists
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
  // Store in a dedicated table or use existing logging
  // For now, we'll insert into a simple audit table if it exists, or just log
  try {
    await supabase.from("automation_runs").insert({
      run_id: log.run_id,
      started_at: log.started_at,
      completed_at: log.completed_at,
      status: log.status,
      books_discovered: log.books_discovered,
      books_verified: log.books_verified,
      books_inserted: log.books_inserted,
      authors_enriched: log.authors_enriched,
      errors: log.errors,
      details: log.details,
    });
  } catch (error) {
    // Table might not exist, just console log
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
    authors_enriched: 0,
    errors: [],
    details: {
      discovered: [],
      verified: [],
      inserted: [],
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

    // Step 2: Filter out books that already exist in our library
    const newCandidates: BookCandidate[] = [];
    for (const candidate of allCandidates) {
      const { data: existing } = await supabase
        .from("books_library")
        .select("id")
        .ilike("title", candidate.title)
        .ilike("author", candidate.author)
        .maybeSingle();

      if (!existing) {
        newCandidates.push(candidate);
      }
    }

    console.log(`[${runId}] ${newCandidates.length} new candidates after deduplication`);

    // Step 3: Verify PDF URLs (limit to MAX_BOOKS_PER_RUN)
    const verifiedBooks: BookCandidate[] = [];
    for (const candidate of newCandidates.slice(0, MAX_BOOKS_PER_RUN)) {
      console.log(`[${runId}] Verifying PDF: ${candidate.title}`);
      const verification = await verifyPdfUrl(candidate.pdf_url);

      if (verification.valid) {
        verifiedBooks.push(candidate);
        log.books_verified++;
        log.details.verified.push({ title: candidate.title, author: candidate.author, source: candidate.source });
        console.log(`[${runId}] ✓ Verified: ${candidate.title}`);
      } else {
        log.errors.push(`PDF verification failed for "${candidate.title}": ${verification.error}`);
        console.log(`[${runId}] ✗ Failed verification: ${candidate.title} - ${verification.error}`);
      }
    }

    // Step 4: Process verified books - enrich authors and upsert
    const processedAuthors = new Set<string>();

    for (const book of verifiedBooks) {
      // Enrich author data
      if (!processedAuthors.has(book.author.toLowerCase())) {
        console.log(`[${runId}] Enriching author: ${book.author}`);
        const authorProfile = await enrichAuthorData(book.author);

        if (authorProfile) {
          const authorResult = await upsertAuthor(supabase, authorProfile);
          if (authorResult) {
            log.authors_enriched++;
            log.details.authors.push({ id: authorResult.id, name: authorProfile.name });
            processedAuthors.add(book.author.toLowerCase());
            console.log(`[${runId}] ✓ Author enriched: ${book.author}`);
          }
        }
      }

      // Upsert book (find author_id if exists)
      let authorId: string | null = null;
      const { data: authorData } = await supabase
        .from("authors")
        .select("id")
        .ilike("name", book.author)
        .maybeSingle();

      if (authorData) authorId = authorData.id;

      const bookResult = await upsertBook(supabase, book, authorId || "");
      if (bookResult) {
        log.books_inserted++;
        log.details.inserted.push({ id: bookResult.id, title: book.title });
        console.log(`[${runId}] ✓ Book inserted: ${book.title}`);
      }
    }

    log.status = "completed";
    log.completed_at = new Date().toISOString();

    await logAutomationRun(supabase, log);

    console.log(`[${runId}] Automation completed. Books: ${log.books_inserted}, Authors: ${log.authors_enriched}`);

    return json({
      success: true,
      run_id: runId,
      summary: {
        discovered: log.books_discovered,
        verified: log.books_verified,
        inserted: log.books_inserted,
        authors_enriched: log.authors_enriched,
        errors: log.errors.length,
      },
      details: log.details,
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