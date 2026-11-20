import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Verify admin authorization
 */
async function verifyAdmin(admin: any, userId: string): Promise<boolean> {
  const { data, error } = await admin.from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !error && !!data;
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
 * Validate PDF structure beyond magic bytes - check for proper PDF trailer, xref, and encryption
 */
async function validatePDFStructure(blob: Blob): Promise<{ valid: boolean; pageCount: number | null; encrypted: boolean; error?: string }> {
  try {
    const headerBuffer = await blob.slice(0, 1024).arrayBuffer();
    const header = new TextDecoder().decode(new Uint8Array(headerBuffer));

    if (!header.startsWith("%PDF-")) {
      return { valid: false, pageCount: null, encrypted: false, error: "Missing PDF signature" };
    }

    const encrypted = header.includes("/Encrypt") || (header.includes("/Filter") && header.includes("/V"));

    const size = blob.size;
    const trailerStart = Math.max(0, size - 2048);
    const trailerBuffer = await blob.slice(trailerStart, size).arrayBuffer();
    const trailer = new TextDecoder().decode(new Uint8Array(trailerBuffer));

    if (!trailer.includes("startxref") || !trailer.includes("%%EOF")) {
      return { valid: false, pageCount: null, encrypted, error: "Invalid PDF structure: missing trailer/EOF" };
    }

    const trailerEncrypted = trailer.includes("/Encrypt");
    const isEncrypted = encrypted || trailerEncrypted;

    let pageCount: number | null = null;
    const countMatch = trailer.match(/\/Count\s+(\d+)/);
    if (countMatch) {
      pageCount = Number.parseInt(countMatch[1], 10);
    } else {
      const contentMatch = header.match(/\/Count\s+(\d+)/);
      if (contentMatch) {
        pageCount = Number.parseInt(contentMatch[1], 10);
      }
    }

    if (isEncrypted) {
      return { valid: false, pageCount, encrypted: true, error: "Encrypted PDFs are not accepted. Please provide an unencrypted PDF." };
    }

    return { valid: true, pageCount, encrypted: false };
  } catch (error) {
    return { valid: false, pageCount: null, encrypted: false, error: error instanceof Error ? error.message : "PDF structure validation failed" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!["POST", "GET"].includes(req.method)) return json({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "PDF management service is not configured." }, 503);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sign in as an administrator." }, 401);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Your session is invalid or expired." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Verify admin role
  if (!await verifyAdmin(admin, authData.user.id)) {
    return json({ error: "Administrator permission is required." }, 403);
  }

  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
  } else {
    // GET requests - parse query params
    const urlParams = new URL(req.url).searchParams;
    body.action = urlParams.get("action");
    body.bookId = urlParams.get("bookId");
    body.submissionId = urlParams.get("submissionId");
    body.page = urlParams.get("page");
    body.pageSize = urlParams.get("pageSize");
  }

  const action = body.action;

  // Legacy replacement is not safe against the currently deployed production
  // schema. Keep it closed until its schema migration and end-to-end workflow
  // are deployed. Malware rescan has been removed from this PDF workflow.
  if (action === "replace_pdf") {
    return json({
      error: "This PDF management operation is temporarily unavailable while the production-safe workflow is completed. No PDF or catalogue record was changed.",
    }, 503);
  }
  if (!["delete_pdf", "replace_pdf", "reverify_pdf", "get_pdf_audit", "get_submission_details"].includes(String(action))) {
    return json({ error: "Unsupported action." }, 400);
  }

  // DELETE PDF - Safe deletion with audit
  if (action === "delete_pdf") {
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "Admin deletion via management API";

    if (!UUID.test(bookId)) return json({ error: "Valid book ID required." }, 400);

    const { data, error } = await admin.rpc("delete_pdf_safely", {
      p_book_id: bookId,
      p_admin_user_id: authData.user.id,
      p_reason: reason,
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

  // REPLACE PDF - Replacement with rollback
  if (action === "replace_pdf") {
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const newSubmissionId = typeof body.newSubmissionId === "string" ? body.newSubmissionId.trim() : "";
    const rightsBasis = body.rightsBasis;
    const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
    const rightsNotes = typeof body.rightsNotes === "string" ? body.rightsNotes.trim().slice(0, 500) : "";

    if (!UUID.test(bookId)) return json({ error: "Valid book ID required." }, 400);
    if (!UUID.test(newSubmissionId)) return json({ error: "Valid new submission ID required." }, 400);
    if (typeof rightsBasis !== "string" || !["public_domain", "open_license", "rights_holder", "written_permission", "official_source"].includes(rightsBasis)) {
      return json({ error: "Select a valid distribution-rights basis." }, 400);
    }

    try { new URL(evidenceUrl); } catch { return json({ error: "Valid HTTPS evidence URL required." }, 400); }

    // Get the new submission's PDF from quarantine
    const { data: newSubmission, error: newSubError } = await admin.from("book_pdf_submissions")
      .select("id,storage_path,original_filename,file_size_bytes,pdf_sha256,pdf_page_count")
      .eq("id", newSubmissionId)
      .maybeSingle();

    if (newSubError || !newSubmission) return json({ error: "New submission not found." }, 404);

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

    // Malware scanning is disabled; PDF signature and structure checks remain.

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
      published_at: new Date().toISOString(),
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
        evidence_host: new URL(evidenceUrl).host,
        replacement: true,
        previous_pdf_url: result.previous_pdf_url,
        new_pdf_url: result.new_pdf_url,
      },
    });

    return json({ success: true, new_pdf_url: result.new_pdf_url, previous_pdf_url: result.previous_pdf_url });
  }

  // REVERIFY PDF - Re-run verification on a submission
  if (action === "reverify_pdf") {
    const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";

    if (!UUID.test(submissionId)) return json({ error: "Valid submission ID required." }, 400);

    // Check submission exists and is in a state that can be reverified
    const { data: submission, error: subError } = await admin.from("book_pdf_submissions")
      .select("id,status,storage_path,file_size_bytes,submitted_title,submitted_author,rights_attested")
      .eq("id", submissionId)
      .maybeSingle();

    if (subError || !submission) return json({ error: "Submission not found." }, 404);
    if (!["uploaded", "failed", "needs_review", "approved"].includes(submission.status)) {
      return json({ error: `Cannot reverify submission in status: ${submission.status}` }, 400);
    }
    if (!submission.rights_attested) return json({ error: "Rights attestation required before verification." }, 400);

    // Reset status to scanning and trigger verification
    await admin.from("book_pdf_submissions").update({
      status: "scanning",
      verification_completed_at: null,
      validation_findings: null,
      detected_metadata: null,
      match_confidence: null,
      verification_model: null,
      catalogue_match_status: null,
    }).eq("id", submissionId);

    await admin.from("book_pdf_review_audit").insert({
      submission_id: submissionId,
      reviewer_id: authData.user.id,
      action: "verification_started",
      details: { triggered_by: "admin_reverify" },
    });

    // Call verify-book-pdf function internally (or return instruction to call it)
    // For now, return the info needed to call verify-book-pdf
    return json({
      success: true,
      message: "Submission reset for reverification. Call verify-book-pdf function to complete.",
      submissionId,
      nextStep: "Call verify-book-pdf with this submissionId",
    });
  }

  // GET PDF AUDIT - Get complete audit trail for a book
  if (action === "get_pdf_audit") {
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const page = typeof body.page === "string" ? Number.parseInt(body.page, 10) : 1;
    const pageSize = typeof body.pageSize === "string" ? Number.parseInt(body.pageSize, 10) : 50;

    if (!UUID.test(bookId)) return json({ error: "Valid book ID required." }, 400);

    // Use the RPC for audit trail
    const { data, error } = await admin.rpc("get_pdf_audit_trail", {
      p_book_id: bookId,
    });

    if (error) {
      console.error("Get PDF audit RPC error:", error);
      return json({ error: "Failed to retrieve audit trail." }, 503);
    }

    const allRecords = (data || []) as Array<Record<string, unknown>>;
    const start = (page - 1) * pageSize;
    const paginated = allRecords.slice(start, start + pageSize);

    return json({
      success: true,
      audit: paginated,
      pagination: {
        page,
        pageSize,
        total: allRecords.length,
        totalPages: Math.ceil(allRecords.length / pageSize),
      }
    });
  }

  // GET SUBMISSION DETAILS - Get full details for a submission
  if (action === "get_submission_details") {
    const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";

    if (!UUID.test(submissionId)) return json({ error: "Valid submission ID required." }, 400);

    const { data: submission, error: subError } = await admin.from("book_pdf_submissions")
      .select("*")
      .eq("id", submissionId)
      .maybeSingle();

    if (subError || !submission) return json({ error: "Submission not found." }, 404);

    // Get audit trail for this submission
    const { data: audit } = await admin.from("book_pdf_review_audit")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });

    return json({ success: true, submission, audit: audit || [] });
  }

  return json({ error: "Unknown action." }, 400);
});