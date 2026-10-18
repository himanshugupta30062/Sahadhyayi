-- RAG foundation for Sahadhyayi Book Expert.
-- Uses Gemini Embedding 2 at a fixed 768 dimensions. All indexed source material
-- must be public/approved content; this migration does not download or copy book PDFs.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.book_expert_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (
    source_type IN ('book_metadata', 'book_summary', 'approved_text', 'site_article')
  ),
  source_ref text NOT NULL,
  book_id uuid REFERENCES public.books_library(id) ON DELETE SET NULL,
  title text NOT NULL,
  author text,
  source_url text,
  source_license text,
  content text NOT NULL CHECK (length(content) <= 500000),
  content_sha256 text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  ingest_status text NOT NULL DEFAULT 'pending' CHECK (
    ingest_status IN ('pending', 'processing', 'indexed', 'failed')
  ),
  failure_reason text,
  indexed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_ref)
);

CREATE INDEX IF NOT EXISTS idx_book_expert_documents_book_id
  ON public.book_expert_documents(book_id);
CREATE INDEX IF NOT EXISTS idx_book_expert_documents_type_status
  ON public.book_expert_documents(source_type, ingest_status);
CREATE INDEX IF NOT EXISTS idx_book_expert_documents_active
  ON public.book_expert_documents(is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.book_expert_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.book_expert_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 6000),
  embedding extensions.vector(768),
  embedding_model text NOT NULL DEFAULT 'gemini-embedding-2',
  content_sha256 text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, content)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index, embedding_model)
);

CREATE INDEX IF NOT EXISTS idx_book_expert_chunks_document
  ON public.book_expert_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_book_expert_chunks_search
  ON public.book_expert_chunks USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_book_expert_chunks_embedding
  ON public.book_expert_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.book_expert_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_expert_chunks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_expert_documents FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.book_expert_chunks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.book_expert_documents TO authenticated;
GRANT SELECT ON TABLE public.book_expert_chunks TO authenticated;
GRANT ALL ON TABLE public.book_expert_documents TO service_role;
GRANT ALL ON TABLE public.book_expert_chunks TO service_role;

DROP POLICY IF EXISTS "Admins can view Book Expert RAG documents"
  ON public.book_expert_documents;
CREATE POLICY "Admins can view Book Expert RAG documents"
  ON public.book_expert_documents
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view Book Expert RAG chunks"
  ON public.book_expert_chunks;
CREATE POLICY "Admins can view Book Expert RAG chunks"
  ON public.book_expert_chunks
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.match_book_expert_chunks(
  p_query_embedding extensions.vector(768),
  p_query_text text,
  p_match_count integer DEFAULT 6,
  p_match_threshold double precision DEFAULT 0.34
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  source_type text,
  source_ref text,
  book_id uuid,
  title text,
  author text,
  source_url text,
  source_license text,
  content text,
  similarity double precision,
  keyword_score real,
  metadata jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  WITH query_terms AS (
    SELECT plainto_tsquery('simple'::regconfig, coalesce(p_query_text, '')) AS query
  ),
  semantic_candidates AS (
    SELECT
      c.id AS chunk_id,
      (1 - (c.embedding <=> p_query_embedding))::double precision AS similarity,
      ts_rank_cd(c.search_vector, qt.query)::real AS keyword_score
    FROM public.book_expert_chunks c
    JOIN public.book_expert_documents d ON d.id = c.document_id
    CROSS JOIN query_terms qt
    WHERE d.is_active = true
      AND d.ingest_status = 'indexed'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> p_query_embedding
    LIMIT LEAST(GREATEST(coalesce(p_match_count, 6), 1) * 5, 60)
  ),
  keyword_candidates AS (
    SELECT
      c.id AS chunk_id,
      (1 - (c.embedding <=> p_query_embedding))::double precision AS similarity,
      ts_rank_cd(c.search_vector, qt.query)::real AS keyword_score
    FROM public.book_expert_chunks c
    JOIN public.book_expert_documents d ON d.id = c.document_id
    CROSS JOIN query_terms qt
    WHERE d.is_active = true
      AND d.ingest_status = 'indexed'
      AND c.embedding IS NOT NULL
      AND numnode(qt.query) > 0
      AND c.search_vector @@ qt.query
    ORDER BY ts_rank_cd(c.search_vector, qt.query) DESC
    LIMIT LEAST(GREATEST(coalesce(p_match_count, 6) * 3, 12), 40)
  ),
  candidate_scores AS (
    SELECT
      merged.chunk_id,
      max(merged.similarity) AS similarity,
      max(merged.keyword_score) AS keyword_score
    FROM (
      SELECT * FROM semantic_candidates
      UNION ALL
      SELECT * FROM keyword_candidates
    ) merged
    GROUP BY merged.chunk_id
  )
  SELECT
    c.id AS chunk_id,
    d.id AS document_id,
    d.source_type,
    d.source_ref,
    d.book_id,
    d.title,
    d.author,
    d.source_url,
    d.source_license,
    c.content,
    scores.similarity,
    scores.keyword_score,
    d.metadata
  FROM candidate_scores scores
  JOIN public.book_expert_chunks c ON c.id = scores.chunk_id
  JOIN public.book_expert_documents d ON d.id = c.document_id
  WHERE d.is_active = true
    AND d.ingest_status = 'indexed'
    AND (
      scores.similarity >= coalesce(p_match_threshold, 0.34)
      OR scores.keyword_score > 0
    )
  ORDER BY
    (0.82 * greatest(scores.similarity, 0) +
     0.18 * least(scores.keyword_score * 4, 1)) DESC
  LIMIT LEAST(GREATEST(coalesce(p_match_count, 6), 1), 10);
$$;

REVOKE ALL ON FUNCTION public.match_book_expert_chunks(
  extensions.vector, text, integer, double precision
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_book_expert_chunks(
  extensions.vector, text, integer, double precision
) TO service_role;

NOTIFY pgrst, 'reload schema';
