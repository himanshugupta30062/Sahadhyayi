import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { AlertCircle, BookOpen, CheckCircle2, ExternalLink, FileJson, RefreshCw, ShieldCheck, Upload } from "lucide-react";

type ReviewIssue = { code: string; severity?: string; detail?: string };
type SuggestedChange = { field: string; currentValue: string; proposedValue: string; reason?: string; requiresHumanApproval?: boolean };
type QueueItem = {
  bookId: string;
  title: string;
  route?: string | null;
  score?: number;
  grade?: string;
  reviewStatus?: string;
  issues?: ReviewIssue[];
  suggestedChanges?: SuggestedChange[];
  reviewActions?: Array<{ issueCode: string; action: string; status?: string }>;
};
type QueueFile = { generatedAt: string; instructions?: string; items: QueueItem[] };
type Decision = {
  id: string;
  book_id: string;
  audit_generated_at: string;
  decision: "approved" | "rejected" | "needs_research";
  evidence_url: string | null;
  evidence_note: string | null;
  reviewed_at: string;
};

const validUrl = (value: string) => {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; }
  catch { return false; }
};

export function parseBookSeoReviewQueue(value: unknown): QueueFile {
  if (!value || typeof value !== "object") throw new Error("The selected file is not a valid review queue.");
  const candidate = value as Partial<QueueFile>;
  if (typeof candidate.generatedAt !== "string" || !Array.isArray(candidate.items)) {
    throw new Error("Expected a review-queue.json file with generatedAt and items.");
  }
  const items = candidate.items.filter((item): item is QueueItem =>
    Boolean(item && typeof item.bookId === "string" && item.bookId && typeof item.title === "string")
  );
  if (!items.length) throw new Error("No valid book review items were found in this queue.");
  return { generatedAt: candidate.generatedAt, instructions: candidate.instructions, items };
}

export default function AdminBookSeoReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueFile | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected" | "needs_research">>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const queueKey = queue?.generatedAt ?? "";
  const { data: saved = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-book-seo-decisions", queueKey],
    enabled: Boolean(user && queueKey),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_seo_review_decisions" as any)
        .select("id,book_id,audit_generated_at,decision,evidence_url,evidence_note,reviewed_at")
        .eq("audit_generated_at", queueKey)
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Decision[];
    },
  });

  const savedByBook = useMemo(() => new Map(saved.map((item) => [item.book_id, item])), [saved]);
  const visibleItems = useMemo(() => (queue?.items ?? []).filter((item) =>
    filter === "all" || !savedByBook.has(item.bookId)
  ), [queue, filter, savedByBook]);
  const reviewedCount = queue?.items.filter((item) => savedByBook.has(item.bookId)).length ?? 0;

  const importQueue = async (file: File) => {
    try {
      const parsed = parseBookSeoReviewQueue(JSON.parse(await file.text()));
      setQueue(parsed);
      setDecisions({});
      setEvidence({});
      setNotes({});
      setFilter("pending");
      toast({ title: "Review queue loaded", description: `${parsed.items.length} books are ready for review.` });
    } catch (error) {
      toast({ title: "Could not load review queue", description: error instanceof Error ? error.message : "Invalid JSON file.", variant: "destructive" });
    }
  };

  const saveDecision = async (item: QueueItem) => {
    if (!user || !queue) return;
    const decision = decisions[item.bookId];
    if (!decision) {
      toast({ title: "Choose a review outcome", description: "Select approved, rejected, or needs research before saving.", variant: "destructive" });
      return;
    }
    const sourceUrl = (evidence[item.bookId] ?? "").trim();
    if (sourceUrl && !validUrl(sourceUrl)) {
      toast({ title: "Invalid evidence URL", description: "Enter a valid HTTP or HTTPS source URL.", variant: "destructive" });
      return;
    }
    if (decision === "approved" && !sourceUrl) {
      toast({ title: "Evidence required", description: "Add a source URL before approving this review.", variant: "destructive" });
      return;
    }
    setSavingId(item.bookId);
    try {
      const { error } = await supabase.from("book_seo_review_decisions" as any).upsert({
        book_id: item.bookId,
        audit_generated_at: queue.generatedAt,
        decision,
        evidence_url: sourceUrl || null,
        evidence_note: (notes[item.bookId] ?? "").trim() || null,
        reviewer_id: user.id,
        review_payload: item,
        reviewed_at: new Date().toISOString(),
      }, { onConflict: "book_id,audit_generated_at" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-book-seo-decisions", queue.generatedAt] });
      toast({ title: "Review saved", description: "The decision and evidence were recorded. Catalogue data was not changed." });
    } catch (error) {
      toast({ title: "Could not save review", description: error instanceof Error ? error.message : "Database request failed.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SEO title="Book SEO Review | Admin" description="Review book metadata quality findings and record evidence-backed decisions." noIndex />
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" /> Administrator tools</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Book SEO review queue</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Import the read-only catalogue audit, verify each issue against reliable sources, and record an auditable decision.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importQueue(file); event.currentTarget.value = ""; }} />
          <Button onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import review-queue.json</Button>
          {queue && <Button variant="outline" onClick={() => { void refetch(); }}><RefreshCw className="mr-2 h-4 w-4" /> Refresh decisions</Button>}
        </div>
      </header>

      {!queue ? (
        <section className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <FileJson className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Load a catalogue audit</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Run <code>npm run audit:books:seo</code>, then import <code>reports/book-seo-quality/review-queue.json</code>. The audit itself is read-only.</p>
          <Button className="mt-5" variant="outline" onClick={() => fileRef.current?.click()}>Choose JSON file</Button>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Books in this audit</p><p className="mt-1 text-2xl font-semibold">{queue.items.length}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Reviews recorded</p><p className="mt-1 text-2xl font-semibold">{reviewedCount}</p></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Awaiting review</p><p className="mt-1 text-2xl font-semibold">{queue.items.length - reviewedCount}</p></div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Audit generated: {new Date(queue.generatedAt).toLocaleString()}</p>
            <div className="flex gap-2">
              <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Pending</Button>
              <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All books</Button>
            </div>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Loading saved decisions…</p>}
          {visibleItems.map((item) => {
            const existing = savedByBook.get(item.bookId);
            return (
              <article key={item.bookId} className="space-y-4 rounded-2xl border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Grade {item.grade ?? "—"}</Badge><Badge variant="secondary">Score {item.score ?? "—"}/100</Badge>{existing && <Badge className="bg-emerald-600">Reviewed</Badge>}</div>
                    <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                    <p className="text-xs text-muted-foreground">Book ID: {item.bookId}</p>
                    {item.route && <a className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline" href={item.route} target="_blank" rel="noreferrer">Open book page <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.issues?.length ?? 0} issues · {item.suggestedChanges?.length ?? 0} safe formatting suggestions</div>
                </div>
                {(item.issues?.length ?? 0) > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold">Findings</h3>{item.issues?.map((issue) => <div key={issue.code} className="flex gap-2 rounded-lg bg-muted/50 p-3 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><span className="font-medium">{issue.code.replaceAll("_", " ")}</span><p className="text-muted-foreground">{issue.detail}</p></div></div>)}</div>}
                {(item.suggestedChanges?.length ?? 0) > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold">Proposed formatting-only changes</h3>{item.suggestedChanges?.map((change) => <div key={change.field} className="grid gap-1 rounded-lg border p-3 text-sm sm:grid-cols-[120px,1fr]"><span className="font-medium">{change.field}</span><div><p className="text-muted-foreground">Current: <code>{change.currentValue}</code></p><p>Proposed: <code>{change.proposedValue}</code></p><p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Human approval required; not applied automatically.</p></div></div>)}</div>}
                {item.reviewActions?.length ? <div className="space-y-1"><h3 className="text-sm font-semibold">Research instructions</h3>{item.reviewActions.map((action) => <p key={action.issueCode} className="text-sm text-muted-foreground">• {action.issueCode}: {action.action}</p>)}</div> : null}
                <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor={`decision-${item.bookId}`}>Review outcome</Label><select id={`decision-${item.bookId}`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={decisions[item.bookId] ?? existing?.decision ?? ""} onChange={(event) => setDecisions((prev) => ({ ...prev, [item.bookId]: event.target.value as "approved" | "rejected" | "needs_research" }))}><option value="">Choose outcome</option><option value="approved">Verified / approve review</option><option value="rejected">Reject proposed correction</option><option value="needs_research">Needs more research</option></select></div>
                  <div className="space-y-2"><Label htmlFor={`evidence-${item.bookId}`}>Source evidence URL {decisions[item.bookId] === "approved" || existing?.decision === "approved" ? "(required for approval)" : "(optional)"}</Label><Input id={`evidence-${item.bookId}`} type="url" placeholder="https://publisher-or-library.example/book" value={evidence[item.bookId] ?? existing?.evidence_url ?? ""} onChange={(event) => setEvidence((prev) => ({ ...prev, [item.bookId]: event.target.value }))} /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor={`notes-${item.bookId}`}>Reviewer notes</Label><Textarea id={`notes-${item.bookId}`} rows={2} placeholder="Record edition details, ISBN evidence, or why the finding was rejected…" value={notes[item.bookId] ?? existing?.evidence_note ?? ""} onChange={(event) => setNotes((prev) => ({ ...prev, [item.bookId]: event.target.value }))} /></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{existing ? `Last reviewed ${new Date(existing.reviewed_at).toLocaleString()}` : "Not yet reviewed"}</p>
                  <Button onClick={() => void saveDecision(item)} disabled={savingId === item.bookId}>{savingId === item.bookId ? "Saving…" : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save review</>}</Button>
                </div>
              </article>
            );
          })}
          {visibleItems.length === 0 && <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground"><BookOpen className="mx-auto mb-2 h-6 w-6" />No pending items in this view.</div>}
        </>
      )}
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong>Safety:</strong> Saving a decision records reviewer, timestamp, evidence, and the audit snapshot. It does not edit the public book catalogue. Catalogue corrections remain a separate, explicitly approved operation.</p>
    </div>
  );
}
