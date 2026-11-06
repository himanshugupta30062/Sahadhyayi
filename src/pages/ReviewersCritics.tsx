import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, ExternalLink, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

type LiteraryCreator = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  creator_roles: string[] | null;
  genres: string[] | null;
  languages: string[] | null;
  website_url: string | null;
  featured: boolean | null;
  verified: boolean | null;
};

const ROLE_LABELS: Record<string, string> = {
  reviewer: "Book Reviewer",
  critic: "Literary Critic",
  booktuber: "BookTuber",
  bookstagrammer: "Bookstagrammer",
  booktok: "BookTok Creator",
  blogger: "Literary Blogger",
};

const roleLabel = (role: string) => ROLE_LABELS[role] ?? role.replace(/_/g, " ");

export default function ReviewersCritics() {
  const [creators, setCreators] = useState<LiteraryCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  useEffect(() => {
    let active = true;
    const loadCreators = async () => {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("literary_creators")
        .select("id,name,slug,bio,avatar_url,creator_roles,genres,languages,website_url,featured,verified")
        .eq("status", "published")
        .order("featured", { ascending: false })
        .order("name", { ascending: true })
        .limit(500);
      if (!active) return;
      if (queryError) {
        setError("The creator directory is temporarily unavailable. Please try again shortly.");
        setCreators([]);
      } else {
        setCreators((data ?? []) as LiteraryCreator[]);
      }
      setLoading(false);
    };
    void loadCreators();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return creators.filter((creator) => {
      const matchesRole = role === "all" || (creator.creator_roles ?? []).includes(role);
      const haystack = [creator.name, creator.bio, ...(creator.genres ?? []), ...(creator.languages ?? []), ...(creator.creator_roles ?? [])].join(" ").toLowerCase();
      return matchesRole && (!term || haystack.includes(term));
    });
  }, [creators, role, search]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO title="Reviewers & Critics | Sahadhyayi" description="Discover book reviewers, literary critics, BookTubers and independent literary voices." canonical="https://sahadhyayi.com/reviewers-critics" url="https://sahadhyayi.com/reviewers-critics" />
      <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
        <img
          src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2400&q=85"
          alt=""
          aria-hidden="true"
          className="absolute right-0 top-0 z-0 h-full w-full object-cover object-[center_35%] sm:w-[65%] lg:w-[60%]"
          loading="eager"
        />
        {/* Mobile scrim for readability */}
        <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-b from-[#101711]/92 via-[#101711]/86 to-[#101711]/80 sm:hidden" />
        {/* Desktop gradient blend */}
        <div aria-hidden="true" className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-r from-[#101711] via-[#101711]/85 to-[#101711]/25" />
        <div aria-hidden="true" className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-t from-[#101711]/80 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#D5B16D,transparent_35%),radial-gradient(circle_at_80%_70%,#3D7554,transparent_40%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Badge className="mb-5 border-[#D5B16D]/40 bg-white/10 text-[#E8CC91]">Literary people · Sahadhyayi</Badge>
          <h1 className="max-w-3xl font-serif text-4xl font-bold tracking-tight sm:text-5xl">Reviewers & Critics</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Meet the voices that help us read deeper—book reviewers, literary critics, BookTubers and independent creators.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-[#D5B16D] text-[#171C17] hover:bg-[#E4C17B]"><Link to="/social?tab=reviews">Explore book reviews <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10"><Link to="/articles">Read literary essays</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-serif text-2xl font-semibold">Discover literary voices</h2><p className="mt-1 text-sm text-muted-foreground">Find people by name, role, genre or language.</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search creators…" className="pl-9" aria-label="Search reviewers and critics" /></div>
        </div>
        <div className="mb-7 flex gap-2 overflow-x-auto pb-1" aria-label="Creator role filters">
          {[["all","All voices"],["reviewer","Reviewers"],["critic","Critics"],["booktuber","BookTubers"],["bookstagrammer","Bookstagram"],["booktok","BookTok"],["blogger","Bloggers"]].map(([value,label]) => <Button key={value} size="sm" variant={role===value?"default":"outline"} onClick={() => setRole(value)}>{label}</Button>)}
        </div>

        {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map((item)=><div key={item} className="h-48 animate-pulse rounded-2xl border bg-muted/40" />)}</div> :
        error ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">{error}</div> :
        filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h3 className="font-semibold">No creators listed yet</h3><p className="mt-2 text-sm text-muted-foreground">{creators.length===0?"We’re preparing the first curated literary voices.":"Try another search or role filter."}</p></div> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((creator)=><article key={creator.id} className="group flex min-w-0 flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
          <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">{creator.avatar_url?<img src={creator.avatar_url} alt={creator.name} loading="lazy" className="h-full w-full object-cover"/>:<BookOpen className="h-6 w-6 text-muted-foreground"/>}</div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{creator.name}</h3><div className="mt-1 flex flex-wrap gap-1">{(creator.creator_roles??[]).slice(0,2).map((item)=><Badge key={item} variant="secondary">{roleLabel(item)}</Badge>)}{creator.verified&&<Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">Verified</Badge>}</div></div></div>
          <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{creator.bio||"A literary voice sharing perspectives on books and reading."}</p>
          <div className="mt-3 flex flex-wrap gap-1">{(creator.genres??[]).slice(0,3).map((genre)=><span key={genre} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{genre}</span>)}</div>
          <div className="mt-auto flex items-center justify-between pt-5"><Button asChild variant="link" className="px-0"><Link to={`/literary-voices/${creator.slug}`}>View profile <ArrowUpRight className="ml-1 h-4 w-4"/></Link></Button>{creator.website_url&&<a href={creator.website_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${creator.name}'s website`} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><ExternalLink className="h-4 w-4"/></a>}</div>
        </article>)}</div>}
      </section>
    </main>
  );
}
