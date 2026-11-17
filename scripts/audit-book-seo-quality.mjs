import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchPaginatedRows } from "./seoBuildUtils.mjs";
import { getPublicSupabaseConfig } from "./publicSupabaseConfig.mjs";
import { auditBookSeoQuality, summarizeBookSeoAudit } from "./bookSeoQualityAudit.mjs";

const { url, key } = getPublicSupabaseConfig();
if (!url || !key) {
  console.error("[book-seo-audit] Supabase read-only credentials are required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [booksResult, authorsResult] = await Promise.all([
  fetchPaginatedRows(
    supabase.from("books_library").select("id,title,description,cover_image_url,author_id,author,isbn,genre,language,pages,publication_year,updated_at").not("id", "is", null),
    "books", 50000,
    (label, limit) => console.warn(`[book-seo-audit] Reached ${limit} row safety cap for ${label}.`),
  ),
  fetchPaginatedRows(
    supabase.from("authors").select("id,name"),
    "authors", 10000,
    (label, limit) => console.warn(`[book-seo-audit] Reached ${limit} row safety cap for ${label}.`),
  ),
]);
if (booksResult.error) throw new Error(`Could not read books_library: ${booksResult.error.message}`);
if (authorsResult.error) throw new Error(`Could not read authors: ${authorsResult.error.message}`);

const records = auditBookSeoQuality(booksResult.data ?? [], authorsResult.data ?? []);
const summary = summarizeBookSeoAudit(records);
const reviewQueue = records
  .filter((record) => record.reviewStatus === "pending_review")
  .map((record) => ({
    bookId: record.id,
    title: record.title,
    route: record.route,
    score: record.score,
    grade: record.grade,
    reviewStatus: "pending_review",
    issues: record.issues,
    suggestedChanges: record.suggestedChanges,
    reviewActions: record.reviewActions,
    reviewerDecision: null,
    reviewedAt: null,
    sourceEvidence: null,
  }));
const generatedAt = new Date().toISOString();
const outputDir = path.resolve(process.env.BOOK_SEO_AUDIT_DIR || "reports/book-seo-quality");
fs.mkdirSync(outputDir, { recursive: true });
const report = { generatedAt, summary, records };
fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(path.join(outputDir, "review-queue.json"), JSON.stringify({ generatedAt, instructions: "Review each item against a reliable source. Do not apply a proposed value without human approval and recorded evidence.", items: reviewQueue }, null, 2) + "\n");
const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};
const columns = ["id", "title", "route", "score", "grade", "issueCount", "issueCodes", "issueDetails", "suggestedChanges", "reviewStatus", "updatedAt"];
const csv = [columns.join(","), ...records.map((record) => [
  record.id, record.title, record.route, record.score, record.grade, record.issueCount,
  record.issues.map((issue) => issue.code).join("; "),
  record.issues.map((issue) => issue.detail).join("; "),
  record.suggestedChanges.map((change) => change.field + ": " + change.proposedValue).join("; "),
  record.reviewStatus,
  record.updatedAt,
].map(csvCell).join(","))].join("\n");
fs.writeFileSync(path.join(outputDir, "report.csv"), csv + "\n");
console.log("[book-seo-audit] Read-only catalogue audit complete.");
console.log(JSON.stringify({ outputDir, reviewQueueItems: reviewQueue.length, ...summary }, null, 2));
