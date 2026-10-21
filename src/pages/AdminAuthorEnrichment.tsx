import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Image, RefreshCw, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

type Stats = { total: number; missingImage: number; pending: number; enriched: number; notFound: number; failed: number };
type BatchResult = { processed: number; enriched: number; notFound: number; failed: number; results?: Array<{name:string;status:string;hasImage:boolean}> };
const BATCH_SIZE = 1;

export default function AdminAuthorEnrichment() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({ total: 0, missingImage: 0, pending: 0, enriched: 0, notFound: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const [progress, setProgress] = useState({ processed: 0, enriched: 0, notFound: 0, failed: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [lastRun, setLastRun] = useState<string>("Not run yet");

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [all, missing, pending, enriched, notFound, failed] = await Promise.all([
        supabase.from("authors").select("id", { count: "exact", head: true }),
        supabase.from("authors").select("id", { count: "exact", head: true }).or("profile_image_url.is.null,profile_image_url.eq."),
        supabase.from("authors").select("id", { count: "exact", head: true }).in("enrichment_status", ["pending", "partial"]),
        supabase.from("authors").select("id", { count: "exact", head: true }).eq("enrichment_status", "enriched"),
        supabase.from("authors").select("id", { count: "exact", head: true }).eq("enrichment_status", "not_found"),
        supabase.from("authors").select("id", { count: "exact", head: true }).eq("enrichment_status", "failed"),
      ]);
      const err = [all, missing, pending, enriched, notFound, failed].find((r) => r.error)?.error;
      if (err) throw err;
      setStats({ total: all.count || 0, missingImage: missing.count || 0, pending: pending.count || 0, enriched: enriched.count || 0, notFound: notFound.count || 0, failed: failed.count || 0 });
    } catch (e) {
      toast({ title: "Could not load author statistics", description: e instanceof Error ? e.message : "Check database permissions.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const run = async (refresh: boolean) => {
    if (running) return;
    setRunning(true); stopRef.current = false;
    setProgress({ processed: 0, enriched: 0, notFound: 0, failed: 0 }); setLogs([]);
    let totals = { processed: 0, enriched: 0, notFound: 0, failed: 0 };
    try {
      // Process up to ten authors per request; the server stops when no eligible records remain.
      for (let i = 0; i < 500; i++) {
        if (stopRef.current) break;
        const { data, error } = await supabase.functions.invoke("enrich-authors", { body: { limit: BATCH_SIZE, refresh } });
        if (error) throw error;
        if (!data || typeof data !== "object") throw new Error("Invalid response from enrichment function.");
        const batch = data as BatchResult & { message?: string; error?: string; detail?: string };
        if (batch.error) throw new Error(batch.detail ? batch.error + ": " + batch.detail : batch.error);
        if (batch.processed === 0) {
          setLogs((old) => [batch.message || "No more matching authors in this batch.", ...old].slice(0, 60));
          break;
        }
        totals = { processed: totals.processed + batch.processed, enriched: totals.enriched + batch.enriched, notFound: totals.notFound + batch.notFound, failed: totals.failed + batch.failed };
        setProgress(totals);
        setLogs((old) => [...(batch.results || []).map((r) => r.name + " — " + r.status + (r.hasImage ? " — image available" : "")), ...old].slice(0, 60));
        await loadStats();
        if (i < 499) await new Promise((resolve) => window.setTimeout(resolve, 900));
      }
      setLastRun(new Date().toLocaleString());
      toast({ title: stopRef.current ? "Stopped after current batch" : "Author import finished", description: totals.processed + " processed · " + totals.enriched + " enriched · " + totals.notFound + " not found · " + totals.failed + " failed." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Author import failed";
      setLogs((old) => [message, ...old].slice(0, 60));
      toast({ title: "Author import failed", description: message, variant: "destructive" });
    } finally { setRunning(false); stopRef.current = false; await loadStats(); }
  };

  const percent = stats.total ? Math.round(stats.enriched / stats.total * 100) : 0;
  return <div className="min-h-screen bg-[#FAF7F2] px-4 py-8 text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7] sm:px-6 lg:px-8">
    <SEO title="Author Data Import | Sahadhyayi Admin" description="Import author biographies, portraits and verified source metadata." />
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#8B6C32]"><Sparkles className="h-4 w-4"/> Author enrichment</div><h1 className="text-3xl font-bold sm:text-4xl">Bring authors to life</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Import portraits, short biographies, birth/death dates, alternate names and source attribution from Wikidata, Wikimedia Commons and Wikipedia. Existing biographies and profile images are preserved.</p></div>
        <Button variant="outline" onClick={() => void loadStats()} disabled={loading || running}><RefreshCw className="mr-2 h-4 w-4"/>Refresh stats</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{label:"Authors in database",value:stats.total,icon:Users},{label:"Missing portraits",value:stats.missingImage,icon:Image},{label:"Successfully enriched",value:stats.enriched,icon:CheckCircle2},{label:"Needs attention",value:stats.failed+stats.notFound,icon:AlertCircle}].map((item) => <Card key={item.label} className="border-[#E5DED2] bg-white dark:border-[#29332D] dark:bg-[#111614]"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-[#F3EBDD] p-3 text-[#1C442D] dark:bg-[#29271F] dark:text-[#D5B16D]"><item.icon className="h-5 w-5"/></div><div><div className="text-sm text-muted-foreground">{item.label}</div><div className="text-3xl font-bold">{loading ? "…" : item.value.toLocaleString()}</div></div></CardContent></Card>)}
      </div>
      <Card className="border-[#E5DED2] bg-white dark:border-[#29332D] dark:bg-[#111614]">
        <CardHeader><CardTitle>Import controls</CardTitle><CardDescription>Processes one author at a time so each portrait and source can be checked before moving on. Public APIs are free but rate-limited; keep this tab open while processing.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Button disabled={running || loading || stats.missingImage+stats.pending===0} onClick={() => void run(false)} className="bg-[#1C442D] text-white hover:bg-[#143221]"><Image className="mr-2 h-4 w-4"/>Import missing portraits / metadata</Button>
            <Button disabled={running || loading} variant="outline" onClick={() => void run(true)}>Retry missing portraits</Button>
            {running && <Button variant="destructive" onClick={() => { stopRef.current = true; }}>Stop after current batch</Button>}
          </div>
          {running && <div className="space-y-2"><div className="flex justify-between text-sm"><span>Processing authors</span><span>{progress.processed} processed</span></div><Progress value={Math.min(100, stats.total ? progress.processed / stats.total * 100 : 0)}/><p className="text-xs text-muted-foreground">A batch already in progress will finish before stopping.</p></div>}
          <div className="grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-muted/60 p-4"><div className="text-xs text-muted-foreground">Processed this run</div><div className="text-2xl font-semibold">{progress.processed}</div></div><div className="rounded-xl bg-muted/60 p-4"><div className="text-xs text-muted-foreground">Enriched</div><div className="text-2xl font-semibold">{progress.enriched}</div></div><div className="rounded-xl bg-muted/60 p-4"><div className="text-xs text-muted-foreground">Not found</div><div className="text-2xl font-semibold">{progress.notFound}</div></div><div className="rounded-xl bg-muted/60 p-4"><div className="text-xs text-muted-foreground">Failed</div><div className="text-2xl font-semibold">{progress.failed}</div></div></div>
          <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span>Authors enriched</span><span>{percent}%</span></div><Progress value={percent}/><p className="text-xs text-muted-foreground">Last run: {lastRun}. Enrichment percentage is based on stored status, not whether every field is complete.</p></div>
        </CardContent>
      </Card>
      <Card className="border-[#E5DED2] bg-white dark:border-[#29332D] dark:bg-[#111614]"><CardHeader><CardTitle>Recent import log</CardTitle><CardDescription>Most recent author results from this session.</CardDescription></CardHeader><CardContent>{logs.length ? <div className="max-h-80 space-y-2 overflow-auto text-sm">{logs.map((line, i) => <div key={i} className="rounded-lg border border-border/60 px-3 py-2">{line}</div>)}</div> : <p className="text-sm text-muted-foreground">No imports run in this session yet.</p>}</CardContent></Card>
      <p className="text-xs leading-5 text-muted-foreground">Image rights matter: attribution and license/source fields are stored when available. Verify the Commons source page before reusing any portrait. Data providers can return no match, especially for authors with common names or regional-language spellings.</p>
    </div>
  </div>;
}