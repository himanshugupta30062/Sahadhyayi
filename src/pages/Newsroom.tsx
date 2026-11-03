import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, FlaskConical, Newspaper, Search, CalendarDays, ExternalLink, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import BookFlipLoader from "@/components/ui/BookFlipLoader";
import { format } from "date-fns";

type NewsCategory = "books" | "authors" | "education" | "research" | "events" | "platform";
type NewsItem = {
  id: string; title: string; slug: string; summary: string | null;
  cover_image_url: string | null; category: NewsCategory; source_name: string | null;
  source_url: string | null; published_at: string;
};

const categories: { value: NewsCategory | "all"; label: string; icon: typeof Newspaper }[] = [
  { value: "all", label: "Top stories", icon: Newspaper },
  { value: "books", label: "Books", icon: BookOpen },
  { value: "authors", label: "Authors", icon: Newspaper },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "research", label: "Science & Research", icon: FlaskConical },
  { value: "events", label: "Events", icon: CalendarDays },
  { value: "platform", label: "Sahadhyayi", icon: Newspaper },
];

const categoryLabel = (category: NewsCategory) => categories.find((c) => c.value === category)?.label || category;
const dateLabel = (date: string) => format(new Date(date), "MMM d, yyyy");

function SourceLink({ item, prominent = false }: { item: NewsItem; prominent?: boolean }) {
  if (!item.source_url) return <span className="text-xs text-muted-foreground">Sahadhyayi update</span>;
  return <a href={item.source_url} target="_blank" rel="noopener noreferrer" className={prominent ? "inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline" : "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"}>Read at source <ArrowUpRight className="h-3.5 w-3.5" /></a>;
}

export default function Newsroom() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const category = (params.get("category") || "all") as NewsCategory | "all";
  const newsQuery = useQuery({
    queryKey: ["newsroom", "published"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("news_articles")
        .select("id,title,slug,summary,cover_image_url,category,source_name,source_url,published_at")
        .eq("status", "published").order("published_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []) as NewsItem[];
    },
  });
  const items = newsQuery.data || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => (category === "all" || item.category === category) &&
      (!q || [item.title, item.summary, item.source_name].some((v) => v?.toLowerCase().includes(q))));
  }, [items, category, search]);
  const lead = category === "all" && !search.trim() ? filtered[0] : undefined;
  const secondary = lead ? filtered.slice(1, 4) : [];
  const rest = lead ? filtered.slice(4) : filtered;

  if (newsQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><BookFlipLoader size="md" text="Loading news..." /></div>;
  if (newsQuery.error) return <main className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">News is temporarily unavailable</h1><p className="mt-2 text-muted-foreground">Please try again shortly.</p></main>;

  return <>
    <SEO title="News | Books, Authors, Education & Research | Sahadhyayi" description="Latest headlines and concise updates on books, authors, education, research, science and events." canonical="https://sahadhyayi.com/news" />
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><Newspaper className="h-4 w-4" /> Sahadhyayi News</div><h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">News &amp; updates</h1><p className="mt-1 text-sm text-muted-foreground">A concise briefing for curious minds.</p></div>
            <div className="w-full sm:w-72"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search headlines..." className="pl-9" /></div></div>
          </div>
        </div>
      </header>
      <div className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8" aria-label="News sections">
          {categories.map(({ value, label, icon: Icon }) => <Button key={value} size="sm" variant={category === value ? "default" : "ghost"} className="shrink-0 rounded-full" onClick={() => setParams(value === "all" ? {} : { category: value })}><Icon className="mr-1.5 h-4 w-4" />{label}</Button>)}
        </nav>
      </div>
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between border-b pb-3"><h2 className="text-lg font-bold">{category === "all" ? "Top stories" : categoryLabel(category)}</h2><span className="text-xs text-muted-foreground">{filtered.length} updates</span></div>
        {filtered.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><Newspaper className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No news in this section</h3><p className="mt-1 text-sm text-muted-foreground">New updates will appear here when published.</p></div> : <>
          {lead && <div className="mb-8 grid gap-6 border-b pb-8 md:grid-cols-[minmax(0,1.65fr)_minmax(260px,1fr)]">
            <article className="min-w-0">
              {lead.cover_image_url ? <a href={lead.source_url || undefined} target="_blank" rel="noopener noreferrer" aria-label={lead.title}><img src={lead.cover_image_url} alt="" className="mb-4 aspect-[16/9] w-full rounded-lg object-cover" loading="lazy" /></a> : <div className="mb-4 flex aspect-[16/9] items-center justify-center rounded-lg bg-muted"><Newspaper className="h-12 w-12 text-muted-foreground/40" /></div>}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Badge>{categoryLabel(lead.category)}</Badge><span>{dateLabel(lead.published_at)}</span><span>·</span><span>{lead.source_name || "Sahadhyayi"}</span></div>
              <h3 className="mt-3 font-serif text-2xl font-bold leading-tight sm:text-3xl">{lead.title}</h3>
              {lead.summary && <p className="mt-3 text-base leading-7 text-muted-foreground">{lead.summary}</p>}
              <div className="mt-4"><SourceLink item={lead} prominent /></div>
            </article>
            <aside aria-label="More top stories" className="divide-y rounded-lg border md:border-0 md:rounded-none md:divide-y">
              {secondary.map((item) => <article key={item.id} className="p-4 first:pt-0 md:px-0 md:py-4">
                <div className="text-xs text-muted-foreground">{categoryLabel(item.category)} · {dateLabel(item.published_at)}</div><h3 className="mt-2 font-serif text-lg font-semibold leading-snug">{item.title}</h3>{item.summary && <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.summary}</p>}<div className="mt-2"><SourceLink item={item} /></div>
              </article>)}
              {secondary.length === 0 && <p className="text-sm text-muted-foreground md:pt-2">More headlines will appear here as news is published.</p>}
            </aside>
          </div>}
          {rest.length > 0 && <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((item) => <article key={item.id} className="min-w-0 border-b pb-5">
            {item.cover_image_url && <a href={item.source_url || undefined} target="_blank" rel="noopener noreferrer" aria-label={item.title}><img src={item.cover_image_url} alt="" className="mb-3 aspect-[16/9] w-full rounded-md object-cover" loading="lazy" /></a>}
            <div className="text-xs text-muted-foreground">{categoryLabel(item.category)} · {dateLabel(item.published_at)}</div><h3 className="mt-2 font-serif text-lg font-semibold leading-snug">{item.title}</h3>{item.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>}<div className="mt-3 flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{item.source_name || "Sahadhyayi"}</span><SourceLink item={item} /></div>
          </article>)}</div>}
        </>}
      </section>
    </main>
  </>;
}
