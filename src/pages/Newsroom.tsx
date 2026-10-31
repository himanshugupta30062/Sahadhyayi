import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, GraduationCap, FlaskConical, Newspaper, Search, CalendarDays, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import BookFlipLoader from "@/components/ui/BookFlipLoader";
import { format } from "date-fns";

type NewsCategory = "books" | "authors" | "education" | "research";
type NewsItem = {
  id: string; title: string; slug: string; summary: string | null; content: string;
  cover_image_url: string | null; category: NewsCategory; source_name: string | null;
  source_url: string | null; author_name: string | null; published_at: string;
};

const categories: { value: NewsCategory | "all"; label: string; icon: typeof Newspaper }[] = [
  { value: "all", label: "All News", icon: Newspaper },
  { value: "books", label: "Books", icon: BookOpen },
  { value: "authors", label: "Authors", icon: Newspaper },
  { value: "education", label: "Study & Education", icon: GraduationCap },
  { value: "research", label: "Research & Science", icon: FlaskConical },
];

export default function Newsroom() {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const category = (params.get("category") || "all") as NewsCategory | "all";
  const newsQuery = useQuery({
    queryKey: ["newsroom", "published"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("news_articles")
        .select("id,title,slug,summary,content,cover_image_url,category,source_name,source_url,author_name,published_at")
        .eq("status", "published").order("published_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []) as NewsItem[];
    },
  });
  const items = newsQuery.data || [];
  const article = slug ? items.find((item) => item.slug === slug) : undefined;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => (category === "all" || item.category === category) &&
      (!q || [item.title, item.summary, item.content, item.author_name, item.source_name].some((v) => v?.toLowerCase().includes(q))));
  }, [items, category, search]);

  if (newsQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><BookFlipLoader size="md" text="Loading newsroom..." /></div>;
  if (newsQuery.error) return <main className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Newsroom is temporarily unavailable</h1><p className="mt-2 text-muted-foreground">Please try again shortly.</p></main>;

  if (slug) {
    if (!article) return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">News article not found</h1><Link className="mt-4 inline-block underline" to="/news">Back to Newsroom</Link></main>;
    return <>
      <SEO title={article.title + " | Sahadhyayi Newsroom"} description={article.summary || article.title} canonical={"https://sahadhyayi.com/news/" + article.slug} />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/news" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Newsroom</Link>
        <div className="mb-4 flex flex-wrap items-center gap-2"><Badge>{categories.find((c) => c.value === article.category)?.label || article.category}</Badge><span className="text-sm text-muted-foreground">{format(new Date(article.published_at), "MMM d, yyyy")}</span></div>
        <h1 className="font-serif text-3xl font-bold leading-tight sm:text-5xl">{article.title}</h1>
        {article.summary && <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.summary}</p>}
        {article.cover_image_url && <img src={article.cover_image_url} alt="" className="mt-8 max-h-[520px] w-full rounded-2xl object-cover" loading="lazy" />}
        <div className="prose prose-lg dark:prose-invert mt-9 max-w-none whitespace-pre-wrap leading-8">{article.content}</div>
        <div className="mt-10 border-t pt-5 text-sm text-muted-foreground">
          {article.author_name && <span>By {article.author_name}</span>}
          {article.source_name && <span className="ml-3">Source: {article.source_name}</span>}
          {article.source_url && <a className="ml-3 inline-flex items-center gap-1 underline" href={article.source_url} target="_blank" rel="noreferrer">Original source <ExternalLink className="h-3 w-3" /></a>}
        </div>
      </main>
    </>;
  }

  return <>
    <SEO title="Newsroom | Books, Authors & Education News | Sahadhyayi" description="The latest book releases, author updates, education news, research and science developments, curated by Sahadhyayi." canonical="https://sahadhyayi.com/news" />
    <main className="min-h-screen bg-background">
      <section className="border-b bg-[#101711] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300"><Newspaper className="h-4 w-4" /> Sahadhyayi Newsroom</div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold sm:text-6xl">Stories shaping the world of knowledge.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">Books, authors, education, research and science — important updates for curious minds.</p>
          <div className="mt-7 max-w-xl"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search headlines, authors or topics..." className="h-12 bg-white pl-10 text-slate-900" /></div></div>
        </div>
      </section>
      <div className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8" aria-label="News categories">
          {categories.map(({ value, label, icon: Icon }) => <Button key={value} size="sm" variant={category === value ? "default" : "outline"} className="shrink-0 rounded-full" onClick={() => setParams(value === "all" ? {} : { category: value })}><Icon className="mr-1.5 h-4 w-4" />{label}</Button>)}
        </nav>
      </div>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">{categories.find((c) => c.value === category)?.label || "All News"}</h2><span className="text-sm text-muted-foreground">{filtered.length} stories</span></div>
        {filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center"><Newspaper className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No news published yet</h3><p className="mt-1 text-sm text-muted-foreground">New stories will appear here as the newsroom grows.</p></div> :
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <article key={item.id} className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg">
            <Link to={"/news/" + item.slug} className="block">
              {item.cover_image_url ? <img src={item.cover_image_url} alt="" className="h-52 w-full object-cover" loading="lazy" /> : <div className="flex h-52 items-center justify-center bg-muted"><Newspaper className="h-12 w-12 text-muted-foreground/40" /></div>}
              <div className="p-5"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">{categories.find((c) => c.value === item.category)?.label || item.category}</Badge><span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />{format(new Date(item.published_at), "MMM d, yyyy")}</span></div>
                <h3 className="mt-4 line-clamp-2 font-serif text-xl font-semibold leading-snug group-hover:text-primary">{item.title}</h3>
                {item.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">Read story <span className="ml-1">→</span></span>
              </div>
            </Link>
          </article>)}</div>}
      </section>
    </main>
  </>;
}
