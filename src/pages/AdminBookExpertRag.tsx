import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, Database, FileText, LoaderCircle, Play, Square, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

type SourceType = "book_metadata" | "book_summary";
type RunState = "book_metadata" | "book_summary" | "approved_text" | null;

type RagStats = {
  documents: number;
  indexedDocuments: number;
  failedDocuments: number;
  chunks: number;
  embeddedChunks: number;
};

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1300;

const emptyStats: RagStats = {
  documents: 0,
  indexedDocuments: 0,
  failedDocuments: 0,
  chunks: 0,
  embeddedChunks: 0,
};

const readSavedOffsets = (): Record<SourceType, number> => {
  const fallback: Record<SourceType, number> = { book_metadata: 0, book_summary: 0 };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem("sahadhyayi_book_expert_rag_offsets_v1");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      book_metadata: Number.isInteger(parsed?.book_metadata) && parsed.book_metadata >= 0 ? parsed.book_metadata : 0,
      book_summary: Number.isInteger(parsed?.book_summary) && parsed.book_summary >= 0 ? parsed.book_summary : 0,
    };
  } catch {
    return fallback;
  }
};

const AdminBookExpertRag = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<RagStats>(emptyStats);
  const [offsets, setOffsets] = useState<Record<SourceType, number>>(readSavedOffsets);
  const [running, setRunning] = useState<RunState>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, indexed: 0, unchanged: 0, failed: 0 });
  const [lastMessage, setLastMessage] = useState("RAG indexing has not started in this session.");
  const [loadingStats, setLoadingStats] = useState(true);
  const stopRequested = useRef(false);

  const [customTitle, setCustomTitle] = useState("");
  const [customRef, setCustomRef] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customLicense, setCustomLicense] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [documentsResult, chunksResult, indexedResult, failedResult, embeddedResult] = await Promise.all([
        supabase.from("book_expert_documents").select("id", { count: "exact", head: true }),
        supabase.from("book_expert_chunks").select("id", { count: "exact", head: true }),
        supabase.from("book_expert_documents").select("id", { count: "exact", head: true }).eq("ingest_status", "indexed"),
        supabase.from("book_expert_documents").select("id", { count: "exact", head: true }).eq("ingest_status", "failed"),
        supabase.from("book_expert_chunks").select("id", { count: "exact", head: true }).not("embedding", "is", null),
      ]);
      const firstError = [documentsResult, chunksResult, indexedResult, failedResult, embeddedResult]
        .find((result) => result.error)?.error;
      if (firstError) throw firstError;
      setStats({
        documents: documentsResult.count ?? 0,
        indexedDocuments: indexedResult.count ?? 0,
        failedDocuments: failedResult.count ?? 0,
        chunks: chunksResult.count ?? 0,
        embeddedChunks: embeddedResult.count ?? 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read RAG statistics.";
      setLastMessage(message.slice(0, 180));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("sahadhyayi_book_expert_rag_offsets_v1", JSON.stringify(offsets));
    } catch {
      // The admin workflow still works if session storage is unavailable.
    }
  }, [offsets]);

  const delay = (milliseconds: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

  const seedBatch = async (sourceType: SourceType, offset: number) => {
    const { data, error } = await supabase.functions.invoke("book-expert-ingest", {
      body: { action: "seed_catalog", sourceType, offset, limit: BATCH_SIZE },
    });
    if (error) throw error;
    if (!data || typeof data !== "object") throw new Error("Ingestion returned an invalid response.");
    return data as {
      requested: number;
      indexed: number;
      unchanged: number;
      failed: number;
      nextOffset: number | null;
      failures?: Array<{ sourceRef: string; reason: string }>;
    };
  };

  const runSeed = async (sourceType: SourceType, runAll: boolean) => {
    if (running) return;
    stopRequested.current = false;
    setRunning(sourceType);
    setAutoRun(runAll);
    setProgress({ processed: 0, indexed: 0, unchanged: 0, failed: 0 });
    setLastMessage(runAll ? "Full indexing started. Keep this page open." : "Indexing one batch.");

    let cursor = offsets[sourceType];
    let processed = 0;
    let indexed = 0;
    let unchanged = 0;
    let failed = 0;
    let batches = 0;

    try {
      while (!stopRequested.current) {
        const result = await seedBatch(sourceType, cursor);
        batches += 1;
        processed += Number(result.requested || 0);
        indexed += Number(result.indexed || 0);
        unchanged += Number(result.unchanged || 0);
        failed += Number(result.failed || 0);

        setProgress({ processed, indexed, unchanged, failed });
        const requested = Number(result.requested || 0);
        const nextOffset = Number(result.nextOffset);
        setLastMessage(
          sourceType + ": " + processed + " records examined; " +
          indexed + " newly indexed; " + unchanged + " unchanged; " +
          failed + " failed."
        );

        if (Array.isArray(result.failures) && result.failures.length > 0) {
          console.warn("Book Expert RAG indexing failures:", result.failures.slice(0, 5));
        }
        if (!Number.isInteger(nextOffset) || nextOffset < cursor) {
          throw new Error("The ingestion cursor was invalid; indexing was stopped.");
        }
        cursor = nextOffset;
        setOffsets((current) => ({ ...current, [sourceType]: cursor }));

        if (requested === 0 || requested < BATCH_SIZE || !runAll || stopRequested.current) break;
        await delay(BATCH_DELAY_MS);
      }

      toast({
        title: stopRequested.current ? "Indexing stopped" : "Indexing batch complete",
        description: indexed + " new, " + unchanged + " unchanged, " + failed + " failed.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "RAG indexing failed.";
      setLastMessage(message.slice(0, 220));
      toast({ title: "RAG indexing failed", description: message.slice(0, 180), variant: "destructive" });
    } finally {
      setRunning(null);
      setAutoRun(false);
      await loadStats();
    }
  };

  const stop = () => {
    stopRequested.current = true;
    setLastMessage("Stop requested. The current batch will finish before stopping.");
  };

  const ingestApprovedText = async () => {
    if (running) return;
    if (!rightsConfirmed || !customLicense.trim()) {
      toast({
        title: "Rights confirmation required",
        description: "Confirm you have permission to index this text and provide its licence or rights statement.",
        variant: "destructive",
      });
      return;
    }
    if (customTitle.trim().length < 2 || customRef.trim().length < 1 || customContent.trim().length < 80) {
      toast({
        title: "More source details required",
        description: "Provide a title, a source reference, and at least 80 characters of text.",
        variant: "destructive",
      });
      return;
    }

    setRunning("approved_text");
    setLastMessage("Indexing approved text.");
    try {
      const { data, error } = await supabase.functions.invoke("book-expert-ingest", {
        body: {
          action: "ingest_text",
          sourceType: "approved_text",
          sourceRef: customRef.trim(),
          title: customTitle.trim(),
          author: customAuthor.trim() || null,
          sourceUrl: customUrl.trim() || null,
          sourceLicense: customLicense.trim(),
          rightsConfirmed: true,
          content: customContent.trim(),
        },
      });
      if (error) throw error;
      if (!data?.success) {
        throw new Error(
          Array.isArray(data?.failures) && data.failures[0]?.reason
            ? String(data.failures[0].reason)
            : "The source was not fully indexed."
        );
      }
      setLastMessage("Approved text indexed successfully.");
      setCustomTitle("");
      setCustomRef("");
      setCustomAuthor("");
      setCustomUrl("");
      setCustomLicense("");
      setCustomContent("");
      setRightsConfirmed(false);
      toast({ title: "Source indexed", description: "The approved text is now available to RAG retrieval." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not index the text.";
      setLastMessage(message.slice(0, 220));
      toast({ title: "Source indexing failed", description: message.slice(0, 180), variant: "destructive" });
    } finally {
      setRunning(null);
      await loadStats();
    }
  };

  return (
    <>
      <SEO
        title="Book Expert RAG Admin"
        description="Manage and monitor Sahadhyayi Book Expert knowledge indexing."
      />
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Database className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">AI Operations</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Book Expert · RAG</h1>
            <p className="max-w-3xl text-muted-foreground">
              Index catalog metadata, existing summaries, and rights-cleared reading material so Book Expert can cite real evidence.
              Metadata indexing does not create full-book text that Sahadhyayi does not already have.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Documents", value: stats.documents },
              { label: "Indexed", value: stats.indexedDocuments },
              { label: "Chunks", value: stats.chunks },
              { label: "Embedded chunks", value: stats.embeddedChunks },
              { label: "Failed documents", value: stats.failedDocuments },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {loadingStats ? "…" : item.value.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Index catalog metadata
              </CardTitle>
              <CardDescription>
                Small idempotent batches keep API usage manageable. You can test one batch before starting the full backfill.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border p-4">
                  <h3 className="font-semibold">Books library</h3>
                  <p className="text-sm text-muted-foreground">
                    Current resume offset: {offsets.book_metadata.toLocaleString()} · 5 records per batch.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={Boolean(running)} onClick={() => void runSeed("book_metadata", false)}>
                      <Play className="mr-2 h-4 w-4" /> Index next 5
                    </Button>
                    <Button type="button" disabled={Boolean(running)} onClick={() => void runSeed("book_metadata", true)}>
                      <Database className="mr-2 h-4 w-4" /> Index all metadata
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border p-4">
                  <h3 className="font-semibold">Existing summaries</h3>
                  <p className="text-sm text-muted-foreground">
                    Current resume offset: {offsets.book_summary.toLocaleString()} · 5 records per batch.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={Boolean(running)} onClick={() => void runSeed("book_summary", false)}>
                      <Play className="mr-2 h-4 w-4" /> Index next 5
                    </Button>
                    <Button type="button" disabled={Boolean(running)} onClick={() => void runSeed("book_summary", true)}>
                      <Database className="mr-2 h-4 w-4" /> Index all summaries
                    </Button>
                  </div>
                </div>
              </div>

              {running && running !== "approved_text" && (
                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Indexing {running === "book_metadata" ? "catalog metadata" : "book summaries"}
                    {autoRun ? " — full backfill" : " — one batch"}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <p>Examined: <strong>{progress.processed}</strong></p>
                    <p>Indexed: <strong>{progress.indexed}</strong></p>
                    <p>Unchanged: <strong>{progress.unchanged}</strong></p>
                    <p>Failed: <strong>{progress.failed}</strong></p>
                  </div>
                  <Button type="button" variant="outline" onClick={stop}>
                    <Square className="mr-2 h-4 w-4" /> Stop after current batch
                  </Button>
                </div>
              )}

              <div className="rounded-lg bg-muted/60 p-3 text-sm" role="status" aria-live="polite">
                {lastMessage}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={loadingStats || Boolean(running)} onClick={() => void loadStats()}>
                  Refresh index stats
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(running)}
                  onClick={() => {
                    setOffsets({ book_metadata: 0, book_summary: 0 });
                    setLastMessage("Resume offsets reset to zero. Re-indexing stays idempotent but takes extra requests.");
                  }}
                >
                  Reset resume offsets
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                Add approved text
              </CardTitle>
              <CardDescription>
                Use for Sahadhyayi articles, licensed documents, or text you own/have permission to process. No PDF scraping is performed here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rag-source-title">Title</Label>
                  <Input id="rag-source-title" value={customTitle} maxLength={240} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Source title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rag-source-ref">Unique source reference</Label>
                  <Input id="rag-source-ref" value={customRef} maxLength={180} onChange={(event) => setCustomRef(event.target.value)} placeholder="article:slug or public-domain:book-id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rag-source-author">Author (optional)</Label>
                  <Input id="rag-source-author" value={customAuthor} maxLength={160} onChange={(event) => setCustomAuthor(event.target.value)} placeholder="Author or organisation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rag-source-url">Source URL (optional)</Label>
                  <Input id="rag-source-url" value={customUrl} maxLength={2048} onChange={(event) => setCustomUrl(event.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rag-source-license">Licence / rights statement</Label>
                  <Input id="rag-source-license" value={customLicense} maxLength={160} onChange={(event) => setCustomLicense(event.target.value)} placeholder="e.g. Public domain, CC BY 4.0, owned by Sahadhyayi, permission granted" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rag-source-content">Approved text (80–16,000 characters)</Label>
                  <Textarea id="rag-source-content" value={customContent} maxLength={16000} rows={8} onChange={(event) => setCustomContent(event.target.value)} placeholder="Paste only text Sahadhyayi is permitted to index…" />
                  <p className="text-right text-xs text-muted-foreground tabular-nums">{customContent.length.toLocaleString()} / 16,000</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Checkbox id="rag-rights-confirmed" checked={rightsConfirmed} onCheckedChange={(value) => setRightsConfirmed(value === true)} />
                <Label htmlFor="rag-rights-confirmed" className="cursor-pointer text-sm leading-relaxed">
                  I confirm Sahadhyayi owns this content or has permission/licensing that allows it to be indexed and used to answer reader questions.
                </Label>
              </div>

              <Button type="button" disabled={Boolean(running) || !rightsConfirmed} onClick={() => void ingestApprovedText()}>
                {running === "approved_text" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Index approved text
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-muted-foreground">
              The first index covers actual catalog metadata and existing summaries only. Full-book question answering requires rights-cleared text and will not be reliable for books whose content has not been indexed.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Admin-only actions are also verified inside the ingestion Edge Function; hiding this page alone is not the security boundary.
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminBookExpertRag;
