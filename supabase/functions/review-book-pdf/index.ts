import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { validatePDFStructure } from "../_shared/pdfVerification.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RIGHTS = new Set(["public_domain", "open_license", "rights_holder", "written_permission", "official_source"]);

/**
 * Search catalogue with pagination support using the match_catalogue_book RPC
 */
async function searchCatalogue(admin: any, query: string, page = 1, pageSize = 20): Promise<{ books: Array<Record<string, unknown>>; total: number; page: number; pageSize: number }> {
  const parts = query.trim().split(/\s+/);
  let title = query;
  let author = query;

  // Try to separate title and author if query looks like "Title by Author"
  const byIndex = query.toLowerCase().indexOf(" by ");
  if (byIndex > 0) {
    title = query.slice(0, byIndex).trim();
    author = query.slice(byIndex + 4).trim();
  }

  const { data: matches, error } = await admin.rpc("match_catalogue_book", {
    p_title: title,
    p_author: author,
    p_isbn: null,
    p_limit: pageSize + 1, // Fetch one extra to detect if there are more
  });

  if (error) {
    // Production may not yet have the optional fuzzy-match RPC migration.
    // Fall back to the confirmed books_library columns so admins can still
    // select an existing catalogue entry instead of seeing an empty picker.
    console.warn("Catalogue match RPC unavailable; using direct catalogue search.");
    const safeTitle = title.replace(/[%,_]/g, " ").trim();
    const safeAuthor = author.replace(/[%,_]/g, " ").trim();
    const [titleResult, authorResult] = await Promise.all([
      safeTitle
        ? admin.from("books_library").select("id,title,author,isbn,pdf_url,publication_year,language,cover_image_url").ilike("title", `%${safeTitle}%`).limit(100)
        : Promise.resolve({ data: [], error: null }),
      safeAuthor
        ? admin.from("books_library").select("id,title,author,isbn,pdf_url,publication_year,language,cover_image_url").ilike("author", `%${safeAuthor}%`).limit(100)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (titleResult.error || authorResult.error) {
      console.error("Direct catalogue search failed:", titleResult.error || authorResult.error);
      return { books: [], total: 0, page, pageSize };
    }
    const byId = new Map<string, Record<string, unknown>>();
    for (const book of [...(titleResult.data || []), ...(authorResult.data || [])] as Array<Record<string, unknown>>) {
      if (typeof book.id === "string") byId.set(book.id, {
        ...book,
        match_score: 0,
        match_reasons: ["direct_title_or_author_search"],
      });
    }
    const allFallbackMatches = [...byId.values()].sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    const offset = (page - 1) * pageSize;
    return { books: allFallbackMatches.slice(offset, offset + pageSize), total: allFallbackMatches.length, page, pageSize };
  }

  const allMatches = (matches || []) as Array<Record<string, unknown>>;
  const hasMore = allMatches.length > pageSize;
  const books = hasMore ? allMatches.slice(0, pageSize) : allMatches;

  return { books, total: allMatches.length, page, pageSize };
}

/**
 * Get catalogue book by exact ID
 */
async function getCatalogueBookById(admin: any, bookId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await admin
    .from("books_library")
    .select("id,title,author,isbn,pdf_url,publication_year,language,cover_image_url")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Record<string, unknown>;
}

/**
 * Validate evidence URL
 */
function validateEvidenceUrl(url: string): { valid: boolean; host?: string; error?: string } {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return { valid: false, error: "HTTPS required for evidence URLs" };
    return { valid: true, host: parsed.host };
  } catch {
    return { valid: false, error: "Invalid evidence URL" };
  }
}

/**
 * Run Bouncer malware scan with proper timeout handling
 */
async function runMalwareScan(source: Blob, scannerToken: string, apiBase: string): Promise<{ clean: boolean; verdict: string; details: Record<string, unknown> }> {
  const timeoutMs = 60000; // 60 second total timeout
  const deadline = Date.now() + timeoutMs;
  let scanId = "";
  let pollPath = "";

  try {
    // Bouncer v1 accepts files up to ~4.5 MB. Use v2 direct upload for larger PDFs.
    if (source.size <= 4_500_000) {
      const form = new FormData();
      form.append("file", source, "submission.pdf");
      const response = await fetch(`${apiBase}/v1/scan`, {
        method: "POST",
        headers: { "X-API-Key": scannerToken },
        body: form,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error("Bouncer v1 scan creation failed", response.status, errText);
        throw new Error(`Bouncer v1 scan creation failed (${response.status})`);
      }
      const payload = await response.json();
      scanId = payload?.data?.scan_id;
      pollPath = payload?.data?.poll_url || (scanId ? `/v1/scan/${encodeURIComponent(scanId)}` : "");
    } else {
      const createResponse = await fetch(`${apiBase}/v2/scan`, {
        method: "POST",
        headers: { "X-API-Key": scannerToken, "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: "submission.pdf", mime_type: "application/pdf" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!createResponse.ok) {
        const errText = await createResponse.text().catch(() => "");
        console.error("Bouncer v2 scan creation failed", createResponse.status, errText);
        throw new Error(`Bouncer v2 scan creation failed (${createResponse.status})`);
      }
      const payload = await createResponse.json();
      scanId = payload?.data?.scan_id;
      pollPath = payload?.data?.poll_url || (scanId ? `/v2/scan/${encodeURIComponent(scanId)}` : "");
      const upload = payload?.data?.upload;
      if (!scanId || !pollPath || !upload?.url || !upload?.fields || source.size > Number(payload?.data?.max_file_size || 0)) {
        throw new Error("Bouncer returned an invalid or insufficient upload target");
      }
      const uploadForm = new FormData();
      for (const [key, value] of Object.entries(upload.fields as Record<string, string>)) {
        uploadForm.append(key, value);
      }
      uploadForm.append("file", source, "submission.pdf");
      const uploadResponse = await fetch(upload.url, {
        method: "POST",
        body: uploadForm,
        signal: AbortSignal.timeout(20000),
      });
      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text().catch(() => "");
        console.error("Bouncer direct upload failed", uploadResponse.status, errText);
        throw new Error("PDF upload to Bouncer failed");
      }
    }

    if (!scanId || !pollPath || (!pollPath.startsWith("/v1/scan/") && !pollPath.startsWith("/v2/scan/"))) {
      throw new Error("Bouncer did not return a valid scan identifier");
    }

    let verdict = "";
    let scanDetails: Record<string, unknown> = {};
    const pollInterval = 2000;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      const pollResponse = await fetch(new URL(pollPath, apiBase), {
        headers: { "X-API-Key": scannerToken },
        signal: AbortSignal.timeout(10000),
      });
      if (!pollResponse.ok) {
        console.error("Bouncer scan polling failed", pollResponse.status);
        throw new Error("Bouncer polling failed");
      }
      const result = await pollResponse.json();
      const status = result?.data?.status;
      scanDetails = result?.data || {};
      if (status === "failed") {
        return { clean: false, verdict: "failed", details: scanDetails };
      }
      if (status === "completed") {
        verdict = result?.data?.verdict || "";
        break;
      }
    }

    if (!verdict) {
      return { clean: false, verdict: "timeout", details: { ...scanDetails, error: "Scan timed out" } };
    }

    return { clean: verdict === "clean", verdict, details: scanDetails };
  } catch (error) {
    console.error("Bouncer scan error:", error instanceof Error ? error.message : "unknown");
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Review service is not configured." }, 503);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sign in as an administrator." }, 401);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Your session is invalid or expired." }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }

  const submissionId = body.submissionId;
  const action = body.action;

  const validActions = [
    "preview",
    "approve",
    "reject",
    "request_changes",
    "publish",
    "search_catalogue",
    "get_catalogue_book",
    "delete_pdf",
    "replace_pdf",
    "audit_queue",
    "reconcile_queue",
  ];

  if (!validActions.includes(String(action))) {
    return json({ error: "Unsupported review action." }, 400);
  }

  // Catalogue search, queue audit and reconciliation do not require an individual submission ID
  if (!["search_catalogue", "audit_queue", "reconcile_queue"].includes(String(action))) {
    if (typeof submissionId !== "string" || !UUID.test(submissionId)) {
      return json({ error: "A valid submission ID is required." }, 400);
    }
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Verify admin role
  const { data: adminRole, error: roleError } = await admin.from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !adminRole) return json({ error: "Administrator permission is required." }, 403);

  // Handle catalogue search (non-mutating, can be called without submission lock)
  if (action === "search_catalogue") {
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const page = typeof body.page === "number" && body.page > 0 ? body.page : 1;
    const pageSize = typeof body.pageSize === "number" && body.pageSize > 0 && body.pageSize <= 50 ? body.pageSize : 20;

    if (!query || query.length < 2) return json({ error: "Search query must be at least 2 characters." }, 400);

    const result = await searchCatalogue(admin, query, page, pageSize);
    return json({ success: true, ...result });
  }

  if (action === "get_catalogue_book") {
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (!UUID.test(bookId)) return json({ error: "Valid book ID required." }, 400);

    const book = await getCatalogueBookById(admin, bookId);
    if (!book) return json({ error: "Book not found." }, 404);

    return json({ success: true, book });
  }

  // Audit queue for inconsistent records, broken references, or unlinked approvals
  if (action === "audit_queue") {
    const { data: allSubmissions, error: subError } = await admin.from("book_pdf_submissions")
      .select("id,original_filename,submitted_title,status,target_book_id,published_book_id,storage_path,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (subError) return json({ error: "Could not audit review queue." }, 500);

    const issues: Array<{
      submissionId: string;
      title: string;
      type: "missing_file" | "unlinked_published" | "inconsistent_status" | "missing_target";
      message: string;
      autoFixable: boolean;
    }> = [];

    for (const sub of allSubmissions || []) {
      if (sub.status === "approved" && sub.published_book_id) {
        const { data: book } = await admin.from("books_library")
          .select("id,title,pdf_url")
          .eq("id", sub.published_book_id)
          .maybeSingle();

        if (!book) {
          issues.push({
            submissionId: sub.id,
            title: sub.submitted_title || sub.original_filename,
            type: "missing_target",
            message: "Published book record is missing from catalogue.",
            autoFixable: false,
          });
        } else if (!book.pdf_url) {
          issues.push({
            submissionId: sub.id,
            title: book.title || sub.submitted_title || sub.original_filename,
            type: "unlinked_published",
            message: "Submission is marked approved and published, but catalogue book is missing pdf_url.",
            autoFixable: true,
          });
        }
      } else if (sub.status === "approved" && !sub.published_book_id) {
        issues.push({
          submissionId: sub.id,
          title: sub.submitted_title || sub.original_filename,
          type: "inconsistent_status",
          message: "Approved submission is missing published_book_id.",
          autoFixable: false,
        });
      }
    }

    return json({ success: true, totalAudited: allSubmissions?.length || 0, issues });
  }

  // Safe reconciliation for unlinked approved submissions
  if (action === "reconcile_queue") {
    const { data: submissionsToFix, error: fixError } = await admin.from("book_pdf_submissions")
      .select("id,published_book_id,status")
      .eq("status", "approved");

    if (fixError) return json({ error: "Could not query submissions for reconciliation." }, 500);

    let fixedCount = 0;
    for (const sub of submissionsToFix || []) {
      if (sub.published_book_id) {
        const { data: book } = await admin.from("books_library")
          .select("id,pdf_url")
          .eq("id", sub.published_book_id)
          .maybeSingle();

        if (book && !book.pdf_url) {
          const publicPath = `${sub.published_book_id}/${sub.id}.pdf`;
          const pdfUrl = admin.storage.from("book-pdfs").getPublicUrl(publicPath).data.publicUrl;
          await admin.from("books_library").update({ pdf_url: pdfUrl }).eq("id", sub.published_book_id);
          fixedCount++;
        }
      }
    }

    return json({ success: true, fixedCount });
  }

  // For all other actions, fetch submission with lock
  const { data: submission, error: readError } = await admin.from("book_pdf_submissions")
    .select("id,user_id,storage_path,original_filename,file_size_bytes,submitted_title,submitted_author,status,rights_attested,verification_completed_at,malware_scan_status,detected_metadata,validation_findings,published_book_id,author_publication_id,pdf_sha256,pdf_page_count,catalogue_match_status,target_book_id")
    .eq("id", submissionId).maybeSingle();
  if (readError || !submission) return json({ error: "Submission was not found." }, 404);

  if (action === "preview") {
    const { data: signed, error } = await admin.storage.from("book-pdf-quarantine").createSignedUrl(submission.storage_path, 180);
    if (error || !signed?.signedUrl) return json({ error: "Could not create a temporary preview link." }, 503);
    return json({ url: signed.signedUrl, expiresInSeconds: 180 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  if ((action === "reject" || action === "request_changes") && !reason) return json({ error: "Provide a reason for rejection or requested changes." }, 400);

  if (action === "reject" || action === "request_changes") {
    if (action === "reject" && !reason) return json({ error: "Provide a reason for rejection." }, 400);
    const status = action === "reject" ? "rejected" : "needs_review";
    const { error: updateError } = await admin.from("book_pdf_submissions").update({
      status,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? reason : null,
    }).eq("id", submissionId).eq("status", submission.status);
    if (updateError) return json({ error: "Could not save the review decision." }, 503);
    await admin.from("book_pdf_review_audit").insert({
      submission_id: submissionId,
      reviewer_id: authData.user.id,
      action: action === "reject" ? "rejected" : "changes_requested",
      reason: reason || null,
    });
    return json({ success: true, status });
  }

  // One admin approval publishes the inspected PDF directly to the Library.
  if (action === "approve" || action === "publish") {
    // Idempotency check: if already published, return success
    if (submission.status === "approved" && submission.published_book_id) {
      const { data: existingBook } = await admin.from("books_library")
        .select("id,title,pdf_url")
        .eq("id", submission.published_book_id)
        .maybeSingle();
      if (existingBook) {
        return json({
          success: true,
          status: "approved",
          targetBookId: submission.published_book_id,
          pdfUrl: existingBook.pdf_url,
          message: "This submission was already published. Returning existing publication."
        });
      }
    }

    if (submission.status === "rejected") return json({ error: "Rejected submissions cannot be published." }, 409);

    let targetBookId = typeof body.targetBookId === "string" ? body.targetBookId : (typeof submission.target_book_id === "string" ? submission.target_book_id : "");
    const createNewBook = Boolean(body.createNewBook) || !targetBookId;

    // Validate the destination before scanning. New catalogue rows are deferred
    // until after all file and malware checks have passed.
    let createdNewBook = false;
    if (createNewBook) {
      const newTitle = typeof body.newBookTitle === "string" ? body.newBookTitle.trim() : (submission.submitted_title || "");
      if (!newTitle) return json({ error: "Book title is required to create a new catalogue entry." }, 400);
    }

    // Validate an existing target now; defer new-book insertion until the PDF
    // passes its checks so failed scans cannot leave empty catalogue rows.
    if (!createNewBook) {
      if (typeof targetBookId !== "string" || !UUID.test(targetBookId)) return json({ error: "Select a valid existing library book." }, 400);
      const { data: book, error: bookError } = await admin.from("books_library")
        .select("id,title,description,pdf_url")
        .eq("id", targetBookId)
        .maybeSingle();
      if (bookError || !book) return json({ error: "Selected library book was not found." }, 404);
      if (book.pdf_url) return json({ error: "The selected Library book already has a PDF. Submit this as a new edition or choose another book." }, 409);
      if (body.updateBookTitleWithAlias && submission.submitted_title && !book.title.toLowerCase().includes(submission.submitted_title.toLowerCase())) {
        const aliasNote = `Also known as: ${submission.submitted_title}`;
        const updatedDescription = book.description ? `${book.description}\\n\\n${aliasNote}` : aliasNote;
        const { error: aliasError } = await admin.from("books_library").update({ description: updatedDescription }).eq("id", targetBookId);
        if (aliasError) return json({ error: "Could not save the catalogue title alias." }, 503);
      }
    }

    // Download source PDF for malware scan and upload
    const { data: source, error: downloadError } = await admin.storage.from("book-pdf-quarantine").download(submission.storage_path);
    if (downloadError || !source) return json({ error: "Private source PDF could not be retrieved." }, 503);

    // Verify PDF signature again
    const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
    if (new TextDecoder().decode(signature) !== "%PDF-") return json({ error: "Source PDF signature validation failed." }, 422);

    // Validate PDF structure (check for corruption, encryption, etc.)
    const structureValidation = await validatePDFStructure(source);
    if (!structureValidation.valid) {
      return json({ error: `Invalid PDF structure: ${structureValidation.error}` }, 422);
    }
    if (structureValidation.encrypted) {
      return json({ error: "Encrypted PDFs are not accepted. Please provide an unencrypted PDF." }, 422);
    }

    // Run malware scan
    const scannerToken = Deno.env.get("BOUNCER_API_KEY");
    let malwareDetails: Record<string, unknown> = {};

    if (!scannerToken) {
      const allowOverride = Deno.env.get("ALLOW_UNSCANNED_PDF_APPROVAL") === "true" ||
                            Deno.env.get("ENVIRONMENT") === "development" ||
                            Deno.env.get("NODE_ENV") === "test";
      if (allowOverride && body.allowUnscannedApproval === true) {
        malwareDetails = { unscanned_override: true, reason: "Administrative override in non-production environment" };
        await admin.from("book_pdf_submissions").update({
          malware_scan_status: "clean",
        }).eq("id", submissionId);
      } else {
        return json({ error: "Malware scanning is not configured. The PDF remains private and cannot be published until scanning is available." }, 503);
      }
    } else {
      try {
        const apiBase = "https://api.usebouncer.dev";
        const scanResult = await runMalwareScan(source, scannerToken, apiBase);
        malwareDetails = scanResult.details;

        if (!scanResult.clean) {
          // Update submission with malware scan failure
          await admin.from("book_pdf_submissions").update({
            malware_scan_status: scanResult.verdict,
          }).eq("id", submissionId);

          return json({
            error: scanResult.verdict === "timeout"
              ? "Bouncer's scan timed out. Try again later; the PDF was not published."
              : "Bouncer did not classify this PDF as clean. Suspicious or malicious files cannot be published.",
            malware_verdict: scanResult.verdict,
          }, 422);
        }

        await admin.from("book_pdf_submissions").update({
          malware_scan_status: "clean",
        }).eq("id", submissionId);
      } catch (error) {
        console.error("Bouncer scan request failed", error instanceof Error ? error.message : "unknown error");
        return json({ error: "The Bouncer scan failed or timed out. The PDF was not published." }, 503);
      }
    }

    // Create the new catalogue entry only after admin review and file-safety checks.
    if (createNewBook) {
      const newTitle = typeof body.newBookTitle === "string" ? body.newBookTitle.trim() : (submission.submitted_title || "");
      const newAuthor = typeof body.newBookAuthor === "string" ? body.newBookAuthor.trim() : (submission.submitted_author || "Unknown");
      const newGenre = typeof body.newBookGenre === "string" ? body.newBookGenre.trim() : "Classic";
      const newDescription = typeof body.newBookDescription === "string" ? body.newBookDescription.trim() : null;
      const newLanguage = typeof body.newBookLanguage === "string" ? body.newBookLanguage.trim() : "English";
      const { data: createdBook, error: createError } = await admin.from("books_library").insert({
        title: newTitle, author: newAuthor, genre: newGenre, description: newDescription, language: newLanguage,
      }).select("id, title").single();
      if (createError || !createdBook) {
        console.error("Failed to create new catalogue book", createError);
        return json({ error: "Could not create new catalogue book record." }, 503);
      }
      targetBookId = createdBook.id;
      createdNewBook = true;
    }

    // Upload to public bucket. Roll back a just-created catalogue row if Storage fails.
    const publicPath = `${targetBookId}/${submissionId}.pdf`;
    const { error: uploadError } = await admin.storage.from("book-pdfs").upload(publicPath, source, {
      contentType: "application/pdf", cacheControl: "3600", upsert: false,
    });
    if (uploadError) {
      if (createdNewBook) await admin.from("books_library").delete().eq("id", targetBookId);
      return json({ error: "Could not publish the approved PDF. Check the public bucket configuration." }, 503);
    }

    const pdfUrl = admin.storage.from("book-pdfs").getPublicUrl(publicPath).data.publicUrl;

    // Transactional update: link PDF to book with all PDF metadata
    // Keep publication aligned with the deployed books_library schema. The PDF
    // metadata columns are not present in production; the verified source data
    // remains recorded on book_pdf_submissions.
    const { error: updateBookError } = await admin.from("books_library").update({
      pdf_url: pdfUrl,
    }).eq("id", targetBookId);

    if (updateBookError) {
      await admin.storage.from("book-pdfs").remove([publicPath]);
      if (createdNewBook) await admin.from("books_library").delete().eq("id", targetBookId);
      return json({ error: "Could not link the PDF to the library book; publication was rolled back." }, 503);
    }

    // Update submission with publication metadata
    const { error: submissionUpdateError } = await admin.from("book_pdf_submissions").update({
      published_book_id: targetBookId,
      status: "approved",
      published_at: new Date().toISOString(),
      rights_basis: null,
      rights_evidence_url: null,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      catalogue_match_status: submission.catalogue_match_status || (submission.target_book_id === targetBookId ? "admin_selected" : "new_created"),
    }).eq("id", submissionId);

    if (submissionUpdateError) {
      await admin.from("books_library").update({ pdf_url: null }).eq("id", targetBookId);
      await admin.storage.from("book-pdfs").remove([publicPath]);
      if (createdNewBook) await admin.from("books_library").delete().eq("id", targetBookId);
      return json({ error: "Could not save publication metadata; the public link was rolled back." }, 503);
    }

    if (submission.author_publication_id) {
      await admin.from("user_published_books").update({
        status: "approved",
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", submission.author_publication_id);
    }

    await admin.from("book_pdf_review_audit").insert({
      submission_id: submissionId,
      reviewer_id: authData.user.id,
      action: "published",
      details: {
        target_book_id: targetBookId,
        created_new_book: createNewBook,
        malware_details: malwareDetails,
      },
    });

    return json({ success: true, status: "approved", targetBookId, pdfUrl, catalogueAction: createNewBook ? "created" : "matched" });
  }

  // DELETE PDF ACTION - Admin deletion with audit
  if (action === "delete_pdf") {
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const deleteReason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "Admin deletion";

    if (!UUID.test(bookId)) return json({ error: "Valid book ID required." }, 400);

    // Use the RPC for safe deletion with audit
    const { data, error } = await admin.rpc("delete_pdf_safely", {
      p_book_id: bookId,
      p_admin_user_id: authData.user.id,
      p_reason: deleteReason,
    });

    if (error) {
      console.error("Delete PDF RPC error:", error);
      return json({ error: "Failed to delete PDF." }, 503);
    }

    const result = (data || [])[0] as { success: boolean; message: string; deleted_storage_path: string; previous_pdf_url: string } | undefined;
    if (!result?.success) {
      return json({ error: result?.message || "Failed to delete PDF." }, 400);
    }

    return json({ success: true, message: result.message, deleted_storage_path: result.deleted_storage_path, previous_pdf_url: result.previous_pdf_url });
  }

  // REPLACE PDF ACTION - Admin replacement with rollback
  if (action === "replace_pdf") {
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const newSubmissionId = typeof body.newSubmissionId === "string" ? body.newSubmissionId.trim() : "";
    const rightsBasis = body.rightsBasis;
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
    const rightsNotes = typeof body.rightsNotes === "string" ? body.rightsNotes.trim().slice(0, 500) : "";

    if (!UUID.test(bookId)) return json({ error: "Valid book ID required." }, 400);
    if (!UUID.test(newSubmissionId)) return json({ error: "Valid new submission ID required." }, 400);
    if (typeof rightsBasis !== "string" || !RIGHTS.has(rightsBasis)) return json({ error: "Select a valid distribution-rights basis." }, 400);

    const evidenceValidation = validateEvidenceUrl(evidenceUrl);
    if (!evidenceValidation.valid) return json({ error: evidenceValidation.error }, 400);

    // Get the new submission's PDF from quarantine
    const { data: newSubmission, error: newSubError } = await admin.from("book_pdf_submissions")
      .select("id,storage_path,original_filename,file_size_bytes,pdf_sha256,pdf_page_count,submitted_title,submitted_author,status,rights_attested,verification_completed_at")
      .eq("id", newSubmissionId)
      .maybeSingle();

    if (newSubError || !newSubmission) return json({ error: "New submission not found." }, 404);
    if (newSubmission.status !== "needs_review" || !newSubmission.verification_completed_at || !newSubmission.rights_attested) {
      return json({ error: "Replacement PDFs must complete automated verification and contributor rights attestation before publication." }, 409);
    }

    // Verify the new PDF
    const { data: source, error: downloadError } = await admin.storage.from("book-pdf-quarantine").download(newSubmission.storage_path);
    if (downloadError || !source) return json({ error: "New PDF could not be retrieved." }, 503);

    const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
    if (new TextDecoder().decode(signature) !== "%PDF-") return json({ error: "New PDF signature validation failed." }, 422);

    // Validate PDF structure (check for corruption, encryption, etc.)
    const structureValidation = await validatePDFStructure(source);
    if (!structureValidation.valid) {
      return json({ error: `Invalid PDF structure: ${structureValidation.error}` }, 422);
    }
    if (structureValidation.encrypted) {
      return json({ error: "Encrypted PDFs are not accepted. Please provide an unencrypted PDF." }, 422);
    }

    // Run malware scan on new PDF
    const scannerToken = Deno.env.get("BOUNCER_API_KEY");
    if (!scannerToken) return json({ error: "Malware scanning is not configured. The replacement PDF was not published." }, 503);
    if (scannerToken) {
      try {
        const scanResult = await runMalwareScan(source, scannerToken, "https://api.usebouncer.dev");
        if (!scanResult.clean) {
          return json({
            error: "Replacement PDF failed malware scan.",
            malware_verdict: scanResult.verdict
          }, 422);
        }
      } catch {
        return json({ error: "Malware scan failed for replacement PDF." }, 503);
      }
    }

    // Upload new PDF to public bucket
    const newPublicPath = `${bookId}/${newSubmissionId}.pdf`;
    const { error: uploadError } = await admin.storage.from("book-pdfs").upload(newPublicPath, source, {
      contentType: "application/pdf", cacheControl: "3600", upsert: false,
    });
    if (uploadError) return json({ error: "Could not upload replacement PDF." }, 503);

    // Use RPC for atomic replacement with audit
    const { data, error: rpcError } = await admin.rpc("replace_pdf", {
      p_book_id: bookId,
      p_new_storage_path: newPublicPath,
      p_admin_user_id: authData.user.id,
      p_rights_basis: rightsBasis,
      p_rights_notes: rightsNotes,
      p_source_url: evidenceUrl,
      p_file_name: newSubmission.original_filename,
      p_file_size: newSubmission.file_size_bytes,
    });

    if (rpcError) {
      await admin.storage.from("book-pdfs").remove([newPublicPath]);
      console.error("Replace PDF RPC error:", rpcError);
      return json({ error: "Failed to replace PDF." }, 503);
    }

    const result = (data || [])[0] as { success: boolean; message: string; new_pdf_url: string; previous_pdf_url: string } | undefined;
    if (!result?.success) {
      await admin.storage.from("book-pdfs").remove([newPublicPath]);
      return json({ error: result?.message || "Failed to replace PDF." }, 400);
    }

    // Update the new submission as published
    await admin.from("book_pdf_submissions").update({
      published_book_id: bookId,
      rights_basis: rightsBasis,
      rights_evidence_url: evidenceUrl,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      catalogue_match_status: "admin_selected",
      status: "approved",
    }).eq("id", newSubmissionId);

    await admin.from("book_pdf_review_audit").insert({
      submission_id: newSubmissionId,
      reviewer_id: authData.user.id,
      action: "published",
      details: {
        target_book_id: bookId,
        rights_basis: rightsBasis,
        evidence_host: evidenceValidation.host,
        replacement: true,
        previous_pdf_url: result.previous_pdf_url,
        new_pdf_url: result.new_pdf_url,
      },
    });

    return json({ success: true, new_pdf_url: result.new_pdf_url, previous_pdf_url: result.previous_pdf_url });
  }

  return json({ error: "Unknown action." }, 400);
});