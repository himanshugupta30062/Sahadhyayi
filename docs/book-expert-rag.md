# Sahadhyayi Book Expert — RAG architecture and rollout

## What RAG adds

Book Expert now uses a retrieval-augmented generation path:

1. Embed the reader's question with Gemini Embedding 2 at 768 dimensions.
2. Query private book_expert_chunks through a server-only Postgres RPC backed by pgvector HNSW and Postgres full-text search.
3. Supply a small set of retrieved excerpts, labels ([S1], [S2]), and catalog records to Gemini 3.8 Flash.
4. Return the labels and their matching source metadata to the widget so readers can inspect cited evidence.
5. Record only quality/latency/token telemetry, not raw questions or generated answers.

All indexed text is treated as untrusted evidence, never as instructions. Catalog metadata cannot be used to claim details about the full contents of a book. Existing summary text is described as a platform summary, not a verbatim quotation.

## Data sources currently supported

- book_metadata: the public record in books_library (title, author, genre, language, publication year, description).
- book_summary: existing book_summaries rows.
- approved_text: up to 16,000 characters of text submitted by an administrator with its source reference and optional URL/licence.
- site_article: approved article text submitted by an administrator.

The ingest function deliberately does not download arbitrary PDFs or scrape full copyrighted books. For full-book Q&A, import extracted text only when Sahadhyayi has the right to process it, preserving source URL/licence and page/chapter metadata. The first catalog seed builds RAG over actual metadata and existing summaries; it does not magically create full-book text that is not currently in the database.

## Database

Migration supabase/migrations/20261019140000_book_expert_rag.sql creates:

- book_expert_documents: source identity, content hash, license/source metadata, and indexing status.
- book_expert_chunks: text chunks, 768-dimensional embeddings, content hash and keyword index.
- match_book_expert_chunks: service-role-only hybrid retrieval RPC.

Only authenticated administrators can select source/chunk records. The public chat cannot access these tables or call the retrieval RPC directly; it uses the server-side Edge Function.

## Apply and deploy

Apply the database migration before deploying the updated chat or ingest functions. Deploy the ingest function with JWT verification enabled. Then run one small test batch before the full backfill.

Required client-side environment for the seed script:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- BOOK_EXPERT_ADMIN_ACCESS_TOKEN: a valid, current access token for an administrator account.

Never use the service-role key as a script access token or expose it in the frontend.

Test a few existing summaries first:

```bash
npm run rag:seed -- --source=book_summary --max-batches=1
```

Then seed the whole catalog and existing summaries:

```bash
npm run rag:seed -- --source=all
```

The seed is idempotent. It skips documents whose source content hash is unchanged and which already have embeddings. Use the progress output to detect any failed sources. The all-catalog run sends embedding requests and may take several minutes; do not run it automatically on each deploy.

## Validate

1. Query book_expert_documents and book_expert_chunks as an administrator to confirm indexing status and embedded chunk counts.
2. Ask Book Expert questions that should match a specific title or existing summary. It should display source references in its response and expandable source cards below the answer.
3. Run npm run test:book-expert:smoke and then npm run test:book-expert.
4. Inspect latency and failure counts in book_expert_usage_events after actual queries.
5. Add regression examples whenever a wrong or unsupported answer is observed.

The evaluator is a regression harness, not proof that an answer is true. Review a sample of retrieved evidence and model answers manually.

## Scaling toward a complete AI layer

Once catalog/summary RAG works, reuse the same retrieval RPC and source model for other AI features: article research, book Q&A, grounded summary generation, quiz generation, and recommendation explanations. Keep private/user-specific data in separately permissioned retrieval paths, with RLS and server-side user filtering. Do not include private reading history, user profiles, or social messages in shared public RAG indexes.

For full book Q&A, the biggest remaining task is content supply and rights-safe ingestion. Retrieval quality depends on having trustworthy, chunked source text; embeddings only index what has actually been ingested.
