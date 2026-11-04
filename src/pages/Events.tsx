import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Search, Sparkles, ArrowUpRight, Globe2, Ticket, Clock3 } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type EventCategory = { id: string; name: string; slug: string; description?: string | null };
type BookEvent = {
  id: string; title: string; slug: string; description?: string | null; category_id: string;
  start_at: string; end_at?: string | null; timezone?: string | null; venue?: string | null;
  city?: string | null; state?: string | null; country?: string | null; is_online?: boolean;
  registration_url?: string | null; image_url?: string | null; organizer_name?: string | null;
  price_type?: string | null; status: string; featured?: boolean;
};

const categoryFallback = [
  { slug: "book-fair", name: "Book Fairs" }, { slug: "literature-festival", name: "Literature Festivals" },
  { slug: "book-launch", name: "Book Launches" }, { slug: "author-talk", name: "Author Talks" },
  { slug: "workshop", name: "Writing Workshops" }, { slug: "reader-meetup", name: "Reader Meetups" },
  { slug: "booktech", name: "BookTech & Hackathons" }, { slug: "online", name: "Online Events" },
];

const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric",
}).format(new Date(value));

const EventCard = ({ event, category }: { event: BookEvent; category?: string }) => (
  <Card className="group h-full overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
    <Link to={`/events/${event.slug}`} className="block" aria-label={`View ${event.title}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {event.image_url ? <img src={event.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> :
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-primary/5"><CalendarDays className="h-12 w-12 text-primary/50" /></div>}
        {event.featured && <Badge className="absolute left-3 top-3 gap-1"><Sparkles className="h-3 w-3" /> Featured</Badge>}
        <Badge variant="secondary" className="absolute bottom-3 left-3">{event.is_online ? "Online" : event.city || "Location TBA"}</Badge>
      </div>
    </Link>
    <CardContent className="flex h-[calc(100%-auto)] flex-col p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.start_at)}
        {category && <><span>·</span><span>{category}</span></>}
      </div>
      <Link to={`/events/${event.slug}`} className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors hover:text-primary">{event.title}</Link>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{event.description || "Explore this book and literary event on Sahadhyayi."}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{event.is_online ? "Join from anywhere" : [event.venue, event.city].filter(Boolean).join(", ") || "Venue to be announced"}</span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    </CardContent>
  </Card>
);

export default function Events() {
  const [events, setEvents] = useState<BookEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");
  const [mode, setMode] = useState<"all" | "online" | "in-person">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryResult, eventResult] = await Promise.all([
          (supabase as any).from("book_event_categories").select("id,name,slug,description").eq("is_active", true).order("sort_order"),
          (supabase as any).from("book_events").select("*").eq("status", "published").gte("start_at", new Date().toISOString()).order("featured", { ascending: false }).order("start_at").limit(100),
        ]);
        if (categoryResult.error) throw categoryResult.error;
        if (eventResult.error) throw eventResult.error;
        if (active) {
          setCategories(categoryResult.data || []);
          setEvents(eventResult.data || []);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Events are temporarily unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const categoryOptions = categories.length ? categories : categoryFallback;
  const categoryNameById = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);
  const filtered = useMemo(() => events.filter((event) => {
    const matchesQuery = !query.trim() || [event.title, event.description, event.city, event.venue, event.organizer_name].some((value) => value?.toLowerCase().includes(query.toLowerCase()));
    const matchesCity = !city.trim() || [event.city, event.state, event.country].some((value) => value?.toLowerCase().includes(city.toLowerCase()));
    const matchesCategory = category === "all" || event.category_id === category || categories.find((item) => item.id === event.category_id)?.slug === category;
    const matchesMode = mode === "all" || (mode === "online" ? event.is_online : !event.is_online);
    return matchesQuery && matchesCity && matchesCategory && matchesMode;
  }), [events, query, city, category, mode, categories]);
  const featured = filtered.filter((event) => event.featured).slice(0, 3);
  const remaining = filtered.filter((event) => !featured.includes(event));

  return (
    <>
      <SEO title="Book Events & Literary Festivals" description="Discover upcoming book fairs, literature festivals, author talks, book launches, reading meetups and BookTech hackathons across India." canonical="https://sahadhyayi.com/events" keywords={["book events India","book fairs","literature festivals","author events","book launch","reading meetups","BookTech hackathons"]} schema={{"@context":"https://schema.org","@type":"CollectionPage","name":"Sahadhyayi Events","description":"Discover book and literary events across India.","url":"https://sahadhyayi.com/events"}} />
      <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-amber-500/5">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="relative max-w-3xl">
              <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-background/60 px-3 py-1"><CalendarDays className="h-3.5 w-3.5" /> THE LITERARY WORLD, IRL</Badge>
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Books bring us <span className="text-primary">together.</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Find your next book fair, festival, author conversation or reading community. Discover what's happening across India and online.</p>
              <div className="mt-8 grid gap-3 rounded-2xl border border-border/70 bg-background/85 p-3 shadow-xl shadow-primary/5 backdrop-blur sm:grid-cols-[1fr_0.65fr_auto] sm:p-2.5">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search festivals, launches, authors…" className="h-11 border-0 bg-muted/40 pl-10 shadow-none focus-visible:ring-1" aria-label="Search events" /></div>
                <div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or state" className="h-11 border-0 bg-muted/40 pl-10 shadow-none focus-visible:ring-1" aria-label="Filter by city" /></div>
                <Button onClick={() => { setQuery(""); setCity(""); setCategory("all"); setMode("all"); }} variant="outline" className="h-11">Clear filters</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant={mode === "all" ? "default" : "outline"} onClick={() => setMode("all")} className="rounded-full">All events</Button>
                <Button size="sm" variant={mode === "in-person" ? "default" : "outline"} onClick={() => setMode("in-person")} className="rounded-full"><MapPin className="mr-1 h-3.5 w-3.5" /> In person</Button>
                <Button size="sm" variant={mode === "online" ? "default" : "outline"} onClick={() => setMode("online")} className="rounded-full"><Globe2 className="mr-1 h-3.5 w-3.5" /> Online</Button>
              </div>
            </div>
          </div>
        </section>
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Explore the calendar</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Events worth showing up for</h2><p className="mt-2 text-sm text-muted-foreground">{loading ? "Finding upcoming events…" : `${filtered.length} upcoming ${filtered.length === 1 ? "event" : "events"}`}</p></div>
            <div className="flex flex-wrap gap-2">{categoryOptions.map((item) => <Button key={item.slug} size="sm" variant={category === item.slug || category === item.id ? "default" : "outline"} onClick={() => setCategory(category === item.slug || category === item.id ? "all" : (categories.length ? item.id : item.slug))} className="rounded-full">{item.name}</Button>)}</div>
          </div>
          {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <Skeleton key={item} className="aspect-[16/10] rounded-xl" />)}</div> :
            error ? <Card className="border-destructive/30"><CardContent className="py-10 text-center"><CalendarDays className="mx-auto h-10 w-10 text-muted-foreground"/><h3 className="mt-3 font-semibold">Events couldn't load</h3><p className="mt-2 text-sm text-muted-foreground">The events database may not be set up yet. Please try again later.</p><p className="mt-1 text-xs text-muted-foreground">{error}</p></CardContent></Card> :
            filtered.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center py-14 text-center"><div className="rounded-full bg-primary/10 p-4"><CalendarDays className="h-8 w-8 text-primary"/></div><h3 className="mt-4 text-xl font-semibold">No upcoming events found</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">Try another city or category. We're building a verified calendar of book fairs, festivals and reading experiences.</p><Button variant="outline" className="mt-5" onClick={() => {setQuery("");setCity("");setCategory("all");setMode("all");}}>Reset search</Button></CardContent></Card> :
            <>
              {featured.length > 0 && <section className="mb-10"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/><h3 className="text-xl font-semibold">Featured events</h3></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map((event) => <EventCard key={event.id} event={event} category={categoryNameById.get(event.category_id)}/>)}</div></section>}
              <section><h3 className="mb-4 text-xl font-semibold">{featured.length ? "More upcoming events" : "Upcoming events"}</h3><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(featured.length ? remaining : filtered).map((event) => <EventCard key={event.id} event={event} category={categoryNameById.get(event.category_id)}/>)}</div></section>
            </>
          }
          <section className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-primary">KNOW AN EVENT?</p><h3 className="mt-1 text-xl font-bold">Help readers discover it.</h3><p className="mt-2 max-w-xl text-sm text-muted-foreground">Event submissions and organizer tools are coming soon. For now, share an official event source with our team.</p></div><Button asChild variant="outline"><Link to="/feedback">Suggest an event <ArrowUpRight className="ml-2 h-4 w-4"/></Link></Button></div></section>
        </main>
      </div>
    </>
  );
}
