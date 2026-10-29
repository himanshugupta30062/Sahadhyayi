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
  const { data: isAdmin, error: roleError } = await admin.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
  if (roleError || isAdmin !== true) return json({ error: "Administrator permission is required." }, 403);

  const { data: submission, error: readError } = await admin.from("book_pdf_submissions")
    .select("id,user_id,storage_path,original_filename,file_size_bytes,submitted_title,submitted_author,status,rights_attested,detected_metadata,validation_findings,published_book_id")
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
    const { error: updateError } = await admin.from("book_pdf_submissions").update({
      status,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? reason : null,
    }).eq("id", submissionId);
    if (updateError) return json({ error: "Could not save the review decision." }, 503);
    await admin.from("book_pdf_review_audit").insert({
      submission_id: submissionId,
      reviewer_id: authData.user.id,
      action: action === "approve" ? "approved" : action === "reject" ? "rejected" : "changes_requested",
      reason: reason || null,
    });
    return json({ success: true, status });
  }

  if (submission.status !== "approved") return json({ error: "Approve the submission before publishing it." }, 409);
  if (!submission.rights_attested) return json({ error: "A contributor rights attestation is required." }, 409);
  const targetBookId = body.targetBookId;
  const rightsBasis = body.rightsBasis;
  const evidenceUrl = typeof body.evidenceUrl === "string" ? body.evidenceUrl.trim() : "";
  if (typeof targetBookId !== "string" || !UUID.test(targetBookId)) return json({ error: "Select a valid existing library book." }, 400);
  if (typeof rightsBasis !== "string" || !RIGHTS.has(rightsBasis)) return json({ error: "Select a valid distribution-rights basis." }, 400);
  try {
    const parsedEvidence = new URL(evidenceUrl);
    if (parsedEvidence.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return json({ error: "Provide an HTTPS URL for licence, permission, or official-source evidence." }, 400);
  }

  const { data: book, error: bookError } = await admin.from("books_library")
    .select("id,title,pdf_url").eq("id", targetBookId).maybeSingle();
  if (bookError || !book) return json({ error: "Selected library book was not found." }, 404);
  if (book.pdf_url) return json({ error: "This book already has a PDF. Review the existing file before replacing it." }, 409);

  const { data: source, error: downloadError } = await admin.storage.from("book-pdf-quarantine").download(submission.storage_path);
  if (downloadError || !source) return json({ error: "Private source PDF could not be retrieved." }, 503);
  const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") return json({ error: "Source PDF signature validation failed." }, 422);

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
  await admin.from("book_pdf_review_audit").insert({
    submission_id: submissionId,
    reviewer_id: authData.user.id,
    action: "published",
    details: { target_book_id: targetBookId, rights_basis: rightsBasis, evidence_host: new URL(evidenceUrl).host },
  });
  return json({ success: true, status: "approved", targetBookId, pdfUrl });
});
