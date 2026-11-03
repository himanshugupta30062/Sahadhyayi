import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, FlaskConical, Newspaper, Search, CalendarDays, ExternalLink } from "lucide-react";
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
  { value: "all", label: "All News", icon: Newspaper },
  { value: "books", label: "Books", icon: BookOpen },
  { value: "authors", label: "Authors", icon: Newspaper },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "research", label: "Research", icon: FlaskConical },
  { value: "events", label: "Events", icon: CalendarDays },
  { value: "platform", label: "Sahadhyayi", icon: Newspaper },
];

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

  if (newsQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><BookFlipLoader size="md" text="Loading news..." /></div>;
  if (newsQuery.error) return <main className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">News is temporarily unavailable</h1><p className="mt-2 text-muted-foreground">Please try again shortly.</p></main>;

  return <>
    <SEO title="News | Books, Authors, Education & Research | Sahadhyayi" description="Quick updates and headlines on books, authors, education, research, science and events." canonical="https://sahadhyayi.com/news" />
    <main className="min-h-screen bg-background">
      <section className="border-b bg-[#101711] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300"><Newspaper className="h-4 w-4" /> News • Quick updates</div>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">News that matters to curious minds.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">Headlines and concise briefs across books, authors, education, research and events. Read the full update at its original source.</p>
          <div className="mt-6 max-w-xl"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news headlines..." className="h-12 bg-white pl-10 text-slate-900" /></div></div>
        </div>
      </section>
      <div className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8" aria-label="News categories">
          {categories.map(({ value, label, icon: Icon }) => <Button key={value} size="sm" variant={category === value ? "default" : "outline"} className="shrink-0 rounded-full" onClick={() => setParams(value === "all" ? {} : { category: value })}><Icon className="mr-1.5 h-4 w-4" />{label}</Button>)}
        </nav>
      </div>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{categories.find((c) => c.value === category)?.label || "All News"}</h2><span className="text-sm text-muted-foreground">{filtered.length} updates</span></div>
        {filtered.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><Newspaper className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No news here yet</h3><p className="mt-1 text-sm text-muted-foreground">Updates will appear here when published.</p></div> :
          <div className="divide-y rounded-xl border">{filtered.map((item) => <article key={item.id} className="flex gap-4 p-4 sm:p-5">
            {item.cover_image_url && <img src={item.cover_image_url} alt="" className="hidden h-24 w-28 shrink-0 rounded-lg object-cover sm:block" loading="lazy" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{categories.find((c) => c.value === item.category)?.label || item.category}</Badge><span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />{format(new Date(item.published_at), "MMM d, yyyy")}</span></div>
              <h3 className="mt-2 text-base font-semibold leading-snug sm:text-lg">{item.title}</h3>
              {item.summary && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
              <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{item.source_name || "Sahadhyayi"}</span>{item.source_url ? <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">Read source <ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-xs text-muted-foreground">Sahadhyayi update</span>}</div>
            </div>
          </article>)}</div>}
      </section>
    </main>
  </>;
}
