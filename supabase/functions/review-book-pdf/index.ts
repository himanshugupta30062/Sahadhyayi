import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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
  if (typeof submissionId !== "string" || !UUID.test(submissionId)) return json({ error: "A valid submission ID is required." }, 400);
  if (!["preview", "approve", "reject", "request_changes", "publish"].includes(String(action))) return json({ error: "Unsupported review action." }, 400);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  // The service-role client has no auth.uid(); check the stored role after validating the caller JWT.
  const { data: adminRole, error: roleError } = await admin.from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !adminRole) return json({ error: "Administrator permission is required." }, 403);

  const { data: submission, error: readError } = await admin.from("book_pdf_submissions")
    .select("id,user_id,storage_path,original_filename,file_size_bytes,submitted_title,submitted_author,status,rights_attested,detected_metadata,validation_findings,published_book_id,author_publication_id")
    .eq("id", submissionId).maybeSingle();
  if (readError || !submission) return json({ error: "Submission was not found." }, 404);

  if (action === "preview") {
    const { data: signed, error } = await admin.storage.from("book-pdf-quarantine").createSignedUrl(submission.storage_path, 180);
    if (error || !signed?.signedUrl) return json({ error: "Could not create a temporary preview link." }, 503);
    return json({ url: signed.signedUrl, expiresInSeconds: 180 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  if ((action === "reject" || action === "request_changes") && !reason) return json({ error: "Provide a reason for rejection or requested changes." }, 400);

  if (action === "approve" || action === "reject" || action === "request_changes") {
    if (action === "approve" && !submission.rights_attested) return json({ error: "A contributor rights attestation is required." }, 409);
    const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "needs_review";
    let autoBookId: string | null = null;
    let catalogueAction = "pending";
    if (action === "approve") {
      const metadata = (submission.detected_metadata && typeof submission.detected_metadata === "object"
        ? submission.detected_metadata : {}) as Record<string, unknown>;
      const title = String(metadata.detected_title || submission.submitted_title || "").trim().slice(0, 300);
      const author = String(metadata.detected_author || submission.submitted_author || "").trim().slice(0, 200);
      if (!title) return json({ error: "Gemini did not identify a title. Send this submission to manual review instead." }, 409);
      // Exact title + author match only; never attach a contributor PDF to a fuzzy/ambiguous edition.
      let matchesQuery = admin.from("books_library").select("id,title,author,pdf_url").ilike("title", title).limit(3);
      if (author) matchesQuery = matchesQuery.ilike("author", author);
      const { data: matches, error: matchError } = await matchesQuery;
      if (matchError) return json({ error: "Could not safely match this PDF to the catalogue." }, 503);
      const available = (matches || []).filter((book) => !book.pdf_url);
      if (available.length === 1) {
        autoBookId = available[0].id;
        catalogueAction = "matched";
      } else if (!matches?.length) {
        const { data: created, error: createError } = await admin.from("books_library").insert({
          title, author: author || null,
          description: typeof metadata.description === "string" ? metadata.description.slice(0, 2000) : null,
          language: typeof metadata.language === "string" ? metadata.language.slice(0, 80) : "English",
          publication_year: typeof metadata.publication_year === "number" && Number.isInteger(metadata.publication_year) ? metadata.publication_year : null,
          pages: typeof metadata.pages === "number" && Number.isInteger(metadata.pages) ? metadata.pages : null,
          isbn: typeof metadata.isbn === "string" ? metadata.isbn.slice(0, 32) : null,
        }).select("id").single();
        if (createError || !created) return json({ error: "Could not create the catalogue entry automatically." }, 503);
        autoBookId = created.id;
        catalogueAction = "created";
      } else {
        catalogueAction = "ambiguous_or_pdf_exists";
      }
    }
    const { error: updateError } = await admin.from("book_pdf_submissions").update({
      status, reviewed_by: authData.user.id, reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? reason : null,
      ...(autoBookId ? { published_book_id: autoBookId } : {}),
    }).eq("id", submissionId);
    if (updateError) return json({ error: "Could not save the review decision." }, 503);
    await admin.from("book_pdf_review_audit").insert({
      submission_id: submissionId, reviewer_id: authData.user.id,
      action: action === "approve" ? "approved" : action === "reject" ? "rejected" : "changes_requested",
      reason: reason || null, details: action === "approve" ? { catalogue_action: catalogueAction, book_id: autoBookId } : {},
    });
    return json({ success: true, status, catalogueAction, targetBookId: autoBookId });
  }

  if (submission.status !== "approved") return json({ error: "Approve the submission before publishing it." }, 409);
  if (!submission.rights_attested) return json({ error: "A contributor rights attestation is required." }, 409);
  let targetBookId = typeof body.targetBookId === "string" ? body.targetBookId : "";
  const rightsBasis = body.rightsBasis;
  const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
  const createNewBook = Boolean(body.createNewBook);

  if (typeof rightsBasis !== "string" || !RIGHTS.has(rightsBasis)) return json({ error: "Select a valid distribution-rights basis." }, 400);
  try {
    const parsedEvidence = new URL(evidenceUrl);
    if (parsedEvidence.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return json({ error: "Provide an HTTPS URL for licence, permission, or official-source evidence." }, 400);
  }

  if (createNewBook) {
    const newTitle = typeof body.newBookTitle === "string" ? body.newBookTitle.trim() : (submission.submitted_title || "");
    const newAuthor = typeof body.newBookAuthor === "string" ? body.newBookAuthor.trim() : (submission.submitted_author || "Unknown");
    const newGenre = typeof body.newBookGenre === "string" ? body.newBookGenre.trim() : "Classic";
    const newDescription = typeof body.newBookDescription === "string" ? body.newBookDescription.trim() : null;
    const newLanguage = typeof body.newBookLanguage === "string" ? body.newBookLanguage.trim() : "English";

    if (!newTitle) return json({ error: "Book title is required to create a new catalogue entry." }, 400);

    const { data: createdBook, error: createError } = await admin.from("books_library").insert({
      title: newTitle,
      author: newAuthor,
      genre: newGenre,
      description: newDescription,
      language: newLanguage,
    }).select("id, title").single();

    if (createError || !createdBook) {
      console.error("Failed to create new catalogue book", createError);
      return json({ error: "Could not create new catalogue book record." }, 503);
    }
    targetBookId = createdBook.id;
  } else {
    if (typeof targetBookId !== "string" || !UUID.test(targetBookId)) return json({ error: "Select a valid existing library book." }, 400);

    const { data: book, error: bookError } = await admin.from("books_library")
      .select("id,title,description,pdf_url").eq("id", targetBookId).maybeSingle();
    if (bookError || !book) return json({ error: "Selected library book was not found." }, 404);
    if (book.pdf_url) return json({ error: "This book already has a PDF. Review the existing file before replacing it." }, 409);

    if (body.updateBookTitleWithAlias && submission.submitted_title && !book.title.toLowerCase().includes(submission.submitted_title.toLowerCase())) {
      const aliasNote = `Also known as: ${submission.submitted_title}`;
      const updatedDescription = book.description ? `${book.description}\n\n${aliasNote}` : aliasNote;
      await admin.from("books_library").update({ description: updatedDescription }).eq("id", targetBookId);
    }
  }

  const { data: source, error: downloadError } = await admin.storage.from("book-pdf-quarantine").download(submission.storage_path);
  if (downloadError || !source) return json({ error: "Private source PDF could not be retrieved." }, 503);
  const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") return json({ error: "Source PDF signature validation failed." }, 422);

  // If scanner secret is configured, run Bouncer scanning; otherwise allow admin-authorized publish with audit log.
  const scannerToken = Deno.env.get("BOUNCER_API_KEY");
  let scanBypassed = false;
  if (!scannerToken) {
    console.warn("BOUNCER_API_KEY is not configured in Supabase secrets. Publishing with admin authorization.");
    scanBypassed = true;
  } else {
    try {
      const apiBase = "https://api.usebouncer.dev";
      const timeoutMs = 45000;
      const deadline = Date.now() + timeoutMs;
      let scanId = "";
      let pollPath = "";

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
          console.error("Bouncer v1 scan creation failed", response.status);
          return json({ error: "Bouncer could not accept this PDF for scanning. Check the API key, quota, and file size." }, 503);
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
          console.error("Bouncer v2 scan creation failed", createResponse.status);
          return json({ error: "Bouncer could not create a direct-upload scan. Check the API key, quota, and file-size limit." }, 503);
        }
        const payload = await createResponse.json();
        scanId = payload?.data?.scan_id;
        pollPath = payload?.data?.poll_url || (scanId ? `/v2/scan/${encodeURIComponent(scanId)}` : "");
        const upload = payload?.data?.upload;
        if (!scanId || !pollPath || !upload?.url || !upload?.fields || source.size > Number(payload?.data?.max_file_size || 0)) {
          return json({ error: "Bouncer returned an invalid or insufficient upload target for this PDF." }, 503);
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
          console.error("Bouncer direct upload failed", uploadResponse.status);
          return json({ error: "The PDF could not be uploaded to Bouncer for scanning." }, 503);
        }
      }

      if (!scanId || !pollPath || (!pollPath.startsWith("/v1/scan/") && !pollPath.startsWith("/v2/scan/"))) {
        return json({ error: "Bouncer did not return a valid scan identifier." }, 503);
      }

      let verdict = "";
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const pollResponse = await fetch(new URL(pollPath, apiBase), {
          headers: { "X-API-Key": scannerToken },
          signal: AbortSignal.timeout(10000),
        });
        if (!pollResponse.ok) {
          console.error("Bouncer scan polling failed", pollResponse.status);
          return json({ error: "Bouncer could not return the scan result. The PDF was not published." }, 503);
        }
        const result = await pollResponse.json();
        const status = result?.data?.status;
        if (status === "failed") {
          return json({ error: "Bouncer's scan failed. The PDF was not published." }, 422);
        }
        if (status === "completed") {
          verdict = result?.data?.verdict || "";
          break;
        }
      }

      if (verdict !== "clean") {
        return json({ error: verdict ? "Bouncer did not classify this PDF as clean. Suspicious or malicious files cannot be published." : "Bouncer's scan timed out or did not complete. Try again later; the PDF was not published." }, 422);
      }
    } catch (error) {
      console.error("Bouncer scan request failed", error instanceof Error ? error.message : "unknown error");
      return json({ error: "The Bouncer scan failed or timed out. The PDF was not published." }, 503);
    }
  }

  const publicPath = `${targetBookId}/${submissionId}.pdf`;
  const { error: uploadError } = await admin.storage.from("book-pdfs").upload(publicPath, source, {
    contentType: "application/pdf", cacheControl: "3600", upsert: false,
  });
  if (uploadError) return json({ error: "Could not publish the approved PDF. Check the public bucket configuration." }, 503);
  const pdfUrl = admin.storage.from("book-pdfs").getPublicUrl(publicPath).data.publicUrl;

  const { error: updateBookError } = await admin.from("books_library").update({ pdf_url: pdfUrl }).eq("id", targetBookId);
  if (updateBookError) {
    await admin.storage.from("book-pdfs").remove([publicPath]);
    return json({ error: "Could not link the PDF to the library book; publication was rolled back." }, 503);
  }
  const { error: submissionUpdateError } = await admin.from("book_pdf_submissions").update({
    published_book_id: targetBookId,
    rights_basis: rightsBasis,
    rights_evidence_url: evidenceUrl,
    reviewed_by: authData.user.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", submissionId);
  if (submissionUpdateError) {
    await admin.from("books_library").update({ pdf_url: null }).eq("id", targetBookId);
    await admin.storage.from("book-pdfs").remove([publicPath]);
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
      rights_basis: rightsBasis,
      evidence_host: new URL(evidenceUrl).host,
      created_new_book: createNewBook,
      scan_bypassed: scanBypassed,
    },
  });
  return json({ success: true, status: "approved", targetBookId, pdfUrl });
});
