#!/usr/bin/env node

/**
 * Backfill public Sahadhyayi catalog metadata and existing summaries into RAG.
 * This calls the admin-only Edge Function and generates real embedding requests.
 *
 * Required:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   BOOK_EXPERT_ADMIN_ACCESS_TOKEN (a currently valid Supabase admin user access token)
 *
 * Examples:
 *   npm run rag:seed -- --source=book_summary --max-batches=1
 *   npm run rag:seed -- --source=all
 *
 * The default all-source run indexes every catalog record plus existing summaries.
 * Re-running is idempotent: unchanged, indexed sources are skipped.
 */

const supabaseUrl = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).trim().replace(/\/+$/, "");
const anonKey = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();
const adminAccessToken = (process.env.BOOK_EXPERT_ADMIN_ACCESS_TOKEN || "").trim();

if (!supabaseUrl || !anonKey || !adminAccessToken) {
  console.error(
    "Set SUPABASE_URL, SUPABASE_ANON_KEY, and BOOK_EXPERT_ADMIN_ACCESS_TOKEN. " +
    "Use an admin user's access token; never use a service-role key as the access token."
  );
  process.exit(2);
}

function arg(name, fallback) {
  const prefix = "--" + name + "=";
  const entry = process.argv.find((item) => item.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : fallback;
}
function intArg(name, fallback) {
  const raw = arg(name, String(fallback));
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const selectedSource = arg("source", "all");
const maximumBatches = intArg("max-batches", 0);
const delayMs = Math.max(1200, intArg("delay-ms", 1500));
const batchSize = 5;
const endpoint = supabaseUrl + "/functions/v1/book-expert-ingest";
const sources = selectedSource === "all"
  ? ["book_metadata", "book_summary"]
  : [selectedSource];

if (!sources.every((source) => ["book_metadata", "book_summary"].includes(source))) {
  console.error("--source must be all, book_metadata, or book_summary.");
  process.exit(2);
}

async function runBatch(sourceType, offset) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: "Bearer " + adminAccessToken,
      "x-client-info": "sahadhyayi-rag-seed",
    },
    body: JSON.stringify({
      action: "seed_catalog",
      sourceType,
      offset,
      limit: batchSize,
    }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload) {
    const status = response.status;
    const message = typeof payload?.error === "string" ? payload.error : "Unexpected response";
    throw new Error(sourceType + " batch at offset " + offset + " failed: HTTP " + status + " — " + message);
  }
  return payload;
}

let globalBatch = 0;
const totals = {
  indexed: 0,
  unchanged: 0,
  failed: 0,
  documentsRequested: 0,
};

try {
  for (const sourceType of sources) {
    let offset = 0;
    while (true) {
      if (maximumBatches > 0 && globalBatch >= maximumBatches) break;
      const payload = await runBatch(sourceType, offset);
      globalBatch += 1;
      totals.documentsRequested += Number(payload.requested || 0);
      totals.indexed += Number(payload.indexed || 0);
      totals.unchanged += Number(payload.unchanged || 0);
      totals.failed += Number(payload.failed || 0);

      process.stdout.write(JSON.stringify({
        batch: globalBatch,
        sourceType,
        offset,
        requested: payload.requested,
        indexed: payload.indexed,
        unchanged: payload.unchanged,
        failed: payload.failed,
        nextOffset: payload.nextOffset,
      }) + "\n");

      if (Array.isArray(payload.failures) && payload.failures.length) {
        for (const failure of payload.failures) {
          process.stderr.write("  source " + failure.sourceRef + ": " + failure.reason + "\n");
        }
      }

      const requested = Number(payload.requested || 0);
      if (requested === 0 || requested < batchSize) break;
      const nextOffset = Number(payload.nextOffset);
      if (!Number.isInteger(nextOffset) || nextOffset <= offset) {
        throw new Error("Ingestion cursor did not advance; stopping to avoid an infinite loop.");
      }
      offset = nextOffset;
      await sleep(delayMs);
    }
  }
} catch (error) {
  process.stderr.write((error instanceof Error ? error.message : "RAG seed failed") + "\n");
  process.exitCode = 1;
}

console.log(JSON.stringify({
  complete: process.exitCode !== 1 && (maximumBatches === 0 || globalBatch < maximumBatches),
  batches: globalBatch,
  ...totals,
  note: maximumBatches > 0
    ? "Partial run requested. Re-run without --max-batches to continue seeding."
    : "Catalog and summary backfill run finished; review failed counts before relying on retrieval.",
}, null, 2));
