import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Newspaper, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const NEWS_CATEGORIES = [
  { value: "books", label: "Books News" },
  { value: "authors", label: "Authors News" },
  { value: "education", label: "Study & Education News" },
  { value: "research", label: "Research & Science News" },
];

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) + "-" + Date.now().toString(36);

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("books");
  const [cover, setCover] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [authorName, setAuthorName] = useState("");

  const newsQuery = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("news_articles").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (publishNow: boolean) => {
      if (title.trim().length < 5 || content.trim().length < 30) throw new Error("Add a headline and at least 30 characters of story content.");
      if (sourceUrl.trim()) { const url = new URL(sourceUrl); if (!["http:", "https:"].includes(url.protocol)) throw new Error("Source URL must use HTTP or HTTPS."); }
      const { error } = await (supabase as any).from("news_articles").insert({
        title: title.trim(), slug: slugify(title), summary: summary.trim() || null, content: content.trim(),
        category, cover_image_url: cover.trim() || null, source_name: sourceName.trim() || null,
        source_url: sourceUrl.trim() || null, author_name: authorName.trim() || null,
        status: publishNow ? "published" : "draft", published_at: publishNow ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: publishNow ? "News published" : "Draft saved" });
      setTitle(""); setSummary(""); setContent(""); setCover(""); setSourceName(""); setSourceUrl(""); setAuthorName("");
      await queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    },
    onError: (error: Error) => toast({ title: "Could not save news", description: error.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "published" | "archived" }) => {
      const { error } = await (supabase as any).from("news_articles").update({ status, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-news"] }),
    onError: (error: Error) => toast({ title: "Status update failed", description: error.message, variant: "destructive" }),
  });

  return <main className="mx-auto max-w-6xl space-y-7">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Newspaper className="h-4 w-4" /> Editorial desk</div><h1 className="mt-1 text-3xl font-bold">Newsroom Manager</h1><p className="mt-1 text-muted-foreground">Create and publish verified updates across books, authors, education and research.</p></div><Button variant="outline" onClick={() => newsQuery.refetch()} disabled={newsQuery.isFetching}><RefreshCw className={"mr-2 h-4 w-4 " + (newsQuery.isFetching ? "animate-spin" : "")} />Refresh</Button></header>
    <section className="rounded-2xl border bg-card p-5 sm:p-7"><h2 className="flex items-center gap-2 text-xl font-semibold"><Plus className="h-5 w-5" /> Create news story</h2><p className="mb-5 mt-1 text-sm text-muted-foreground">Use your own reporting or clearly attribute the original source. Do not copy full articles from other publishers.</p>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(true); }}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Headline<Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required placeholder="Write a clear, factual headline" /></label><label className="grid gap-1.5 text-sm font-medium">Category<Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NEWS_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></label></div>
        <label className="grid gap-1.5 text-sm font-medium">Short summary<Textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={400} rows={2} placeholder="A concise summary for news cards and search" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Story content<Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Write the original story, context and key details..." required /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Cover image URL (optional)<Input type="url" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." /></label><label className="grid gap-1.5 text-sm font-medium">Byline / reporter (optional)<Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Sahadhyayi Editorial Desk" /></label><label className="grid gap-1.5 text-sm font-medium">Source name (optional)<Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="Publisher, university or news outlet" /></label><label className="grid gap-1.5 text-sm font-medium">Original source URL (optional)<Input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." /></label></div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" disabled={saveMutation.isPending} onClick={() => { saveMutation.mutate(false); }}>Save draft</Button><Button type="submit" disabled={saveMutation.isPending} >{saveMutation.isPending ? "Saving..." : "Publish story"}</Button></div>
      </form>
    </section>
    <section className="rounded-2xl border bg-card p-5 sm:p-7"><h2 className="text-xl font-semibold">Recent stories</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">Manage drafts, published stories and archived items.</p>
      {newsQuery.isLoading ? <p className="py-8 text-center text-muted-foreground">Loading stories...</p> : newsQuery.error ? <p className="py-8 text-center text-destructive">Could not load stories: {(newsQuery.error as Error).message}</p> : !newsQuery.data?.length ? <p className="py-8 text-center text-muted-foreground">No stories created yet.</p> : <div className="space-y-3">{newsQuery.data.map((item: any) => <div key={item.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.title}</h3><Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge><Badge variant="outline">{NEWS_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary || item.slug}</p></div><div className="flex shrink-0 flex-wrap gap-2">{item.status === "published" && <Button asChild size="sm" variant="outline"><Link to={"/news/" + item.slug}>View <ExternalLink className="ml-1 h-3 w-3" /></Link></Button>}{item.status !== "published" && <Button size="sm" onClick={() => updateStatus.mutate({ id: item.id, status: "published" })} disabled={updateStatus.isPending}>Publish</Button>}{item.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: item.id, status: "archived" })} disabled={updateStatus.isPending}>Archive</Button>}</div></div>)}</div>}
    </section>
  </main>;
}
