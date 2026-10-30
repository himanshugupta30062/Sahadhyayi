import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { parseScientistJson, validateScientistProfile } from "@/lib/scientistProfileValidation";

type Region = "india" | "world";
type Status = "draft" | "published" | "archived";
type ScientistRow = {
  id: string; slug: string; name: string; region: Region; discipline: string;
  lifespan: string; summary: string; status: Status; profile_data: Record<string, unknown>;
  sort_order: number;
};
type PublicationRow = {
  id?: string; scientist_id?: string; title: string; year: string; venue: string; authors: string;
  doi?: string; url: string; access: "publisher" | "open" | "catalogue"; note: string; sort_order?: number;
};
type ArchiveRow = {
  id?: string; scientist_id?: string; title: string; institution: string; url: string; material: string;
  note: string; sort_order?: number;
};
type EditorState = {
  slug: string; name: string; region: Region; discipline: string; lifespan: string;
  summary: string; status: Status; sort_order: string; profileData: string;
  publications: string; archives: string;
};
const emptyEditor: EditorState = {
  slug: "", name: "", region: "india", discipline: "", lifespan: "", summary: "",
  status: "draft", sort_order: "0", profileData: JSON.stringify({
    initials: "", headline: "", birthplace: "", knownFor: [], lifeStory: [],
    work: [], milestones: [], legacy: "", sources: [], portrait: null
  }, null, 2),
  publications: "[]", archives: "[]",
};
function toEditor(row?: ScientistRow, publications: PublicationRow[] = [], archives: ArchiveRow[] = []): EditorState {
  if (!row) return emptyEditor;
  return {
    slug: row.slug, name: row.name, region: row.region, discipline: row.discipline,
    lifespan: row.lifespan, summary: row.summary, status: row.status,
    sort_order: String(row.sort_order),
    profileData: JSON.stringify(row.profile_data ?? {}, null, 2),
    publications: JSON.stringify(publications.map(({ scientist_id: _scientistId, ...item }) => item), null, 2),
    archives: JSON.stringify(archives.map(({ scientist_id: _scientistId, ...item }) => item), null, 2),
  };
}

export default function AdminScientists() {
  const { toast } = useToast();
  const [scientists, setScientists] = useState<ScientistRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("new");
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => scientists.find((item) => item.id === selectedId), [scientists, selectedId]);

  const load = useCallback(async (preferredId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("scientists")
        .select("id, slug, name, region, discipline, lifespan, summary, status, profile_data, sort_order")
        .order("sort_order", { ascending: true }).order("name", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as ScientistRow[];
      setScientists(rows);
      const nextId = preferredId ?? (selectedId !== "new" && rows.some((item) => item.id === selectedId) ? selectedId : "new");
      setSelectedId(nextId);
      const row = rows.find((item) => item.id === nextId);
      if (row) {
        const [pubs, archives] = await Promise.all([
          supabase.from("scientist_publications").select("*").eq("scientist_id", row.id).order("sort_order"),
          supabase.from("scientist_archives").select("*").eq("scientist_id", row.id).order("sort_order"),
        ]);
        if (pubs.error) throw pubs.error;
        if (archives.error) throw archives.error;
        setEditor(toEditor(row, (pubs.data ?? []) as PublicationRow[], (archives.data ?? []) as ArchiveRow[]));
      } else setEditor(emptyEditor);
    } catch (error) {
      toast({ title: "Could not load Scientists", description: error instanceof Error ? error.message : "Database request failed.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [selectedId, toast]);

  useEffect(() => { void load(); }, [load]);

  const selectScientist = async (id: string) => {
    setSelectedId(id);
    if (id === "new") { setEditor(emptyEditor); return; }
    const row = scientists.find((item) => item.id === id);
    if (!row) return;
    setLoading(true);
    try {
      const [pubs, archives] = await Promise.all([
        supabase.from("scientist_publications").select("*").eq("scientist_id", id).order("sort_order"),
        supabase.from("scientist_archives").select("*").eq("scientist_id", id).order("sort_order"),
      ]);
      if (pubs.error) throw pubs.error;
      if (archives.error) throw archives.error;
      setEditor(toEditor(row, (pubs.data ?? []) as PublicationRow[], (archives.data ?? []) as ArchiveRow[]));
    } catch (error) {
      toast({ title: "Could not load profile details", description: error instanceof Error ? error.message : "Database request failed.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const slug = editor.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error("Use a URL-safe slug, for example: c-v-raman.");
      if (!editor.name.trim() || !editor.discipline.trim() || !editor.lifespan.trim() || !editor.summary.trim()) {
        throw new Error("Name, discipline, lifespan and summary are required.");
      }
      const profileData = parseScientistJson<Record<string, unknown>>(editor.profileData, "Profile data");
      validateScientistProfile(profileData);
      const publications = parseScientistJson<PublicationRow[]>(editor.publications, "Publications");
      const archives = parseScientistJson<ArchiveRow[]>(editor.archives, "Archives");
      if (!Array.isArray(publications) || !Array.isArray(archives)) throw new Error("Publications and archives must be JSON arrays.");
      publications.forEach((item, index) => {
        if (!item.title || !item.year || !item.venue || !item.authors || !item.url || !["publisher", "open", "catalogue"].includes(item.access)) {
          throw new Error("Publication " + (index + 1) + " is missing required fields or has an invalid access type.");
        }
      });
      archives.forEach((item, index) => {
        if (!item.title || !item.institution || !item.url || !item.material) {
          throw new Error("Archive " + (index + 1) + " is missing required fields.");
        }
      });

      const payload = {
        slug, name: editor.name.trim(), region: editor.region, discipline: editor.discipline.trim(),
        lifespan: editor.lifespan.trim(), summary: editor.summary.trim(), status: editor.status,
        sort_order: Number.parseInt(editor.sort_order, 10) || 0, profile_data: profileData as never, updated_at: new Date().toISOString(),
      };
      const existing = selectedId !== "new" ? scientists.find((item) => item.id === selectedId) : undefined;
      const { data: saved, error } = await supabase.from("scientists")
        .upsert(existing ? { ...payload, id: existing.id } : payload, { onConflict: "slug" })
        .select("id").single();
      if (error) throw error;
      const scientistId = saved.id;

      const syncChildren = async <T extends { id?: string; sort_order?: number },>(
        table: "scientist_publications" | "scientist_archives",
        items: T[],
      ) => {
        const existingRows = table === "scientist_publications"
          ? await supabase.from("scientist_publications").select("id").eq("scientist_id", scientistId)
          : await supabase.from("scientist_archives").select("id").eq("scientist_id", scientistId);
        if (existingRows.error) throw existingRows.error;
        const existingIds = new Set((existingRows.data ?? []).map((item) => item.id));
        const keptIds = new Set(items.flatMap((item) => item.id ? [item.id] : []));
        const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
        if (items.length) {
          const rows = items.map((item, index) => ({ ...item, scientist_id: scientistId, sort_order: item.sort_order ?? index }));
          const upsert = table === "scientist_publications"
            ? await supabase.from("scientist_publications").upsert(rows as never[])
            : await supabase.from("scientist_archives").upsert(rows as never[]);
          if (upsert.error) throw upsert.error;
        }
        // Remove omitted rows only after every submitted row has been saved successfully.
        if (removedIds.length) {
          const deletion = table === "scientist_publications"
            ? await supabase.from("scientist_publications").delete().eq("scientist_id", scientistId).in("id", removedIds)
            : await supabase.from("scientist_archives").delete().eq("scientist_id", scientistId).in("id", removedIds);
          if (deletion.error) throw deletion.error;
        }
      };

      await syncChildren("scientist_publications", publications);
      await syncChildren("scientist_archives", archives);
      toast({ title: editor.status === "published" ? "Scientist published" : "Scientist saved", description: editor.name + " has been saved." });
      await load(scientistId);
    } catch (error) {
      toast({ title: "Could not save scientist", description: error instanceof Error ? error.message : "Check the content and permissions.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!selected || !window.confirm("Permanently delete " + selected.name + " and its publication/archive records?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("scientists").delete().eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Scientist deleted", description: selected.name + " was removed." });
      setSelectedId("new"); setEditor(emptyEditor);
      await load("new");
    } catch (error) {
      toast({ title: "Could not delete scientist", description: error instanceof Error ? error.message : "Database request failed.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setEditor((previous) => ({ ...previous, [key]: value }));

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-8 text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7] sm:px-6 lg:px-8">
      <SEO title="Scientists Content Manager | Sahadhyayi Admin" description="Create, edit and publish scientist profiles and research records." />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/scientists" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Public Scientists collection</Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">Platform administration</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Scientists content manager</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create and maintain profiles, verified research publications and archive references. Drafts remain private until published.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading || saving}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button onClick={() => void selectScientist("new")} disabled={saving}><Plus className="mr-2 h-4 w-4" />New scientist</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="h-fit border-border/70 bg-card">
            <CardHeader><CardTitle>Collection</CardTitle><CardDescription>{scientists.length} profiles · {scientists.filter((item) => item.status === "published").length} published</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {loading && <p className="text-sm text-muted-foreground">Loading collection…</p>}
              {scientists.map((item) => (
                <button key={item.id} type="button" onClick={() => void selectScientist(item.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === item.id ? "border-primary bg-primary/5" : "border-border/70 hover:bg-muted/60"}`}>
                  <span className="block font-medium">{item.name}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{item.region === "india" ? "India" : "Global"} · {item.lifespan}</span><Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge></span>
                </button>
              ))}
              {!loading && scientists.length === 0 && <p className="text-sm text-muted-foreground">No profiles yet. Create the first one.</p>}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardHeader><CardTitle>{selected ? "Edit " + selected.name : "Create a scientist"}</CardTitle><CardDescription>Complete the structured profile before publishing. Use JSON arrays for the longer-form biography and source records.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="scientist-name">Full name</Label><Input id="scientist-name" value={editor.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. A. P. J. Abdul Kalam" /></div>
                <div className="space-y-2"><Label htmlFor="scientist-slug">URL slug</Label><Input id="scientist-slug" value={editor.slug} onChange={(event) => update("slug", event.target.value)} placeholder="a-p-j-abdul-kalam" /></div>
                <div className="space-y-2"><Label>Collection</Label><Select value={editor.region} onValueChange={(value) => update("region", value as Region)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="india">Indian scientists</SelectItem><SelectItem value="world">Global scientists</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Status</Label><Select value={editor.status} onValueChange={(value) => update("status", value as Status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="scientist-discipline">Discipline</Label><Input id="scientist-discipline" value={editor.discipline} onChange={(event) => update("discipline", event.target.value)} placeholder="Physics · Astrophysics" /></div>
                <div className="space-y-2"><Label htmlFor="scientist-lifespan">Lifespan</Label><Input id="scientist-lifespan" value={editor.lifespan} onChange={(event) => update("lifespan", event.target.value)} placeholder="1931–2015" /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="scientist-summary">Short summary</Label><Textarea id="scientist-summary" rows={3} value={editor.summary} onChange={(event) => update("summary", event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="scientist-order">Display order</Label><Input id="scientist-order" type="number" value={editor.sort_order} onChange={(event) => update("sort_order", event.target.value)} /></div>
              </section>
              <section className="space-y-3"><div><h2 className="font-semibold">Biography, work and sources</h2><p className="text-xs text-muted-foreground">JSON object fields: initials, headline, birthplace, knownFor, lifeStory, work, milestones, legacy, sources, portrait. Follow the existing scientist profile structure.</p></div><Textarea className="min-h-[320px] font-mono text-xs" value={editor.profileData} onChange={(event) => update("profileData", event.target.value)} spellCheck={false} /></section>
              <section className="space-y-3"><div><h2 className="font-semibold">Original publications</h2><p className="text-xs text-muted-foreground">JSON array. Each item: title, year, venue, authors, optional doi, url, access (publisher/open/catalogue), note. Existing IDs are retained when editing.</p></div><Textarea className="min-h-[220px] font-mono text-xs" value={editor.publications} onChange={(event) => update("publications", event.target.value)} spellCheck={false} /></section>
              <section className="space-y-3"><div><h2 className="font-semibold">Archives and historical records</h2><p className="text-xs text-muted-foreground">JSON array. Each item: title, institution, url, material, note. Existing IDs are retained when editing.</p></div><Textarea className="min-h-[180px] font-mono text-xs" value={editor.archives} onChange={(event) => update("archives", event.target.value)} spellCheck={false} /></section>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <div>{selected && <Button variant="destructive" onClick={() => void remove()} disabled={saving}><Trash2 className="mr-2 h-4 w-4" />Delete profile</Button>}</div>
                <div className="flex gap-2"><Button variant="outline" onClick={() => void selectScientist("new")} disabled={saving}>Reset</Button><Button onClick={() => void save()} disabled={saving || loading}><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : editor.status === "published" ? "Save & publish" : "Save changes"}</Button></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
