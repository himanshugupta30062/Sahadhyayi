import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Search,
  Sparkles,
  ArrowUpRight,
  Globe2,
  Ticket,
  Clock3,
  CalendarPlus,
  Plus,
  Share2,
  Users,
  Check,
  Bookmark,
} from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CURATED_LITERARY_EVENTS, BookEvent } from "@/data/curatedEvents";
import { SuggestEventDialog } from "@/components/events/SuggestEventDialog";
import { useAuth } from "@/contexts/authHelpers";
import { toast } from "sonner";

type EventCategory = { id: string; name: string; slug: string; description?: string | null };

const categoryFallback: EventCategory[] = [
  { id: "book-fair", slug: "book-fair", name: "Book Fairs" },
  { id: "literature-festival", slug: "literature-festival", name: "Literature Festivals" },
  { id: "book-launch", slug: "book-launch", name: "Book Launches" },
  { id: "author-talk", slug: "author-talk", name: "Author Talks" },
  { id: "workshop", slug: "workshop", name: "Writing Workshops" },
  { id: "reader-meetup", slug: "reader-meetup", name: "Reader Meetups" },
  { id: "booktech", slug: "booktech", name: "BookTech & Hackathons" },
  { id: "online", slug: "online", name: "Online Events" },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const buildGoogleCalendarUrl = (event: BookEvent) => {
  const startIso = new Date(event.start_at).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endIso = event.end_at
    ? new Date(event.end_at).toISOString().replace(/-|:|\.\d\d\d/g, "")
    : new Date(new Date(event.start_at).getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const details = `${event.description || ""}\n\nOfficial Source: ${event.official_source_url}`;
  const location = event.is_online ? "Online" : [event.venue, event.city].filter(Boolean).join(", ");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
};

const EventCard = ({
  event,
  category,
  userRsvp,
  onRsvp,
}: {
  event: BookEvent;
  category?: string;
  userRsvp?: "attending" | "interested" | null;
  onRsvp: (eventId: string, status: "attending" | "interested") => void;
}) => {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.slug}`;
    if (navigator.share) {
      navigator.share({ title: event.title, url }).catch(() => {});
    } else {
      void navigator.clipboard.writeText(url).then(() => {
        toast.success("Event link copied to clipboard!");
      }).catch(() => {});
    }
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link to={`/events/${event.slug}`} className="block" aria-label={`View ${event.title}`}>
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-primary/5">
              <CalendarDays className="h-12 w-12 text-primary/50" />
            </div>
          )}
          {event.featured && (
            <Badge className="absolute left-3 top-3 gap-1 shadow-sm">
              <Sparkles className="h-3 w-3" /> Featured
            </Badge>
          )}
          <Badge variant="secondary" className="absolute bottom-3 left-3 shadow-xs">
            {event.is_online ? "Online" : event.city || "Location TBA"}
          </Badge>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" /> {formatDate(event.start_at)}
          {category && (
            <>
              <span>·</span>
              <span className="font-medium text-foreground/80">{category}</span>
            </>
          )}
        </div>

        <Link
          to={`/events/${event.slug}`}
          className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {event.title}
        </Link>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {event.description || "Explore this book and literary event on Sahadhyayi."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            {event.is_online
              ? "Join from anywhere"
              : [event.venue, event.city].filter(Boolean).join(", ") || "Venue to be announced"}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
              title="Share event"
              aria-label="Share event"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <a
              href={buildGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
              title="Add to Google Calendar"
              aria-label="Add to calendar"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </a>
            <Link to={`/events/${event.slug}`}>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          </div>
        </div>

        {/* RSVP Interactive Bar */}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-muted/40 p-2 text-xs">
          <span className="text-[11px] text-muted-foreground">
            {event.attendees_count
              ? `${event.attendees_count + (userRsvp ? 1 : 0)} interested`
              : "Be the first to RSVP"}
          </span>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={userRsvp === "attending" ? "default" : "outline"}
              className={`h-7 px-2.5 text-[11px] rounded-lg ${
                userRsvp === "attending" ? "font-semibold shadow-xs" : ""
              }`}
              onClick={() => onRsvp(event.id, "attending")}
            >
              {userRsvp === "attending" && <Check className="mr-1 h-3 w-3" />}
              Attending
            </Button>
            <Button
              size="sm"
              variant={userRsvp === "interested" ? "default" : "outline"}
              className={`h-7 px-2.5 text-[11px] rounded-lg ${
                userRsvp === "interested" ? "font-semibold shadow-xs" : ""
              }`}
              onClick={() => onRsvp(event.id, "interested")}
            >
              Interested
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Events() {
  const [events, setEvents] = useState<BookEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");
  const [mode, setMode] = useState<"all" | "online" | "in-person">("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [userRsvps, setUserRsvps] = useState<Record<string, "attending" | "interested">>({});

  // Restore RSVPs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sahadhyayi_event_rsvps");
      if (stored) {
        setUserRsvps(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const handleRsvp = (eventId: string, status: "attending" | "interested") => {
    setUserRsvps((prev) => {
      const current = prev[eventId];
      const next = current === status ? undefined : status;
      const updated = { ...prev };
      if (!next) {
        delete updated[eventId];
        toast.info("RSVP cancelled.");
      } else {
        updated[eventId] = next;
        toast.success(`Marked as ${next === "attending" ? "Attending" : "Interested"}!`);
      }
      try {
        localStorage.setItem("sahadhyayi_event_rsvps", JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      return updated;
    });
  };

  useEffect(() => {
    setVisibleCount(9);
  }, [query, city, category, mode]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        // 1. Fetch categories
        const categoryResult = await (supabase as any)
          .from("literary_event_categories")
          .select("id,name,slug,description")
          .eq("is_active", true)
          .order("sort_order");

        if (categoryResult.error) {
          console.warn("[Events] Categories unavailable; using fallback labels", categoryResult.error);
        } else if (active && categoryResult.data) {
          setCategories(categoryResult.data);
        }

        // 2. Fetch events from database
        let dbEvents: BookEvent[] = [];
        try {
          const eventResult = await (supabase as any)
            .from("literary_events")
            .select("*")
            .eq("status", "published")
            .gte("start_at", new Date().toISOString())
            .order("featured", { ascending: false })
            .order("start_at")
            .limit(100);

          if (!eventResult?.error && eventResult?.data && eventResult.data.length > 0) {
            dbEvents = eventResult.data;
          }
        } catch (dbErr) {
          console.warn("[Events] Error querying literary_events:", dbErr);
        }

        // Also optionally fetch published author_events
        let mappedAuthorEvents: BookEvent[] = [];
        try {
          const authorQuery = (supabase as any).from("author_events");
          if (authorQuery && typeof authorQuery.select === "function") {
            const authorEventsRes = await authorQuery
              .select("*")
              .eq("is_published", true)
              .gte("start_date", new Date().toISOString())
              .order("start_date", { ascending: true })
              .limit(50);

            if (!authorEventsRes?.error && authorEventsRes?.data) {
              mappedAuthorEvents = authorEventsRes.data.map((ae: any) => ({
                id: ae.id,
                title: ae.title,
                slug: `author-event-${ae.id.slice(0, 8)}`,
                description: ae.description || "Author-hosted literary event.",
                category_id: "author-talk",
                category_name: "Author Talks",
                start_at: ae.start_date,
                end_at: ae.end_date,
                venue: ae.location,
                city: ae.location ? ae.location.split(",")[0] : "Online",
                is_online: ae.location?.toLowerCase().includes("online") || false,
                official_source_url: ae.event_url || "https://sahadhyayi.com/events",
                registration_url: ae.event_url,
                image_url: ae.image_url,
                organizer_name: "Featured Author",
                price_type: "free",
                status: "published",
                featured: false,
              }));
            }
          }
        } catch {
          // Ignore author_events query failures
        }

        // 3. If DB events or author events exist, use them; otherwise fallback to curated events
        let combined = [...dbEvents, ...mappedAuthorEvents];
        if (combined.length === 0) {
          combined = CURATED_LITERARY_EVENTS;
        }

        if (active) {
          setEvents(combined);
        }
      } catch (err) {
        console.warn("[Events] Error loading DB events; using curated calendar:", err);
        if (active) {
          setEvents(CURATED_LITERARY_EVENTS);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const categoryOptions = categories.length ? categories : categoryFallback;
  const categoryNameById = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories]
  );

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const matchesQuery =
          !query.trim() ||
          [event.title, event.description, event.city, event.venue, event.organizer_name].some((value) =>
            value?.toLowerCase().includes(query.toLowerCase())
          );
        const matchesCity =
          !city.trim() ||
          [event.city, event.state, event.country].some((value) =>
            value?.toLowerCase().includes(city.toLowerCase())
          );
        const matchesCategory =
          category === "all" ||
          event.category_id === category ||
          categories.find((item) => item.id === event.category_id)?.slug === category;
        const matchesMode =
          mode === "all" || (mode === "online" ? event.is_online : !event.is_online);
        return matchesQuery && matchesCity && matchesCategory && matchesMode;
      }),
    [events, query, city, category, mode, categories]
  );

  const featured = filtered.filter((event) => event.featured).slice(0, 3);
  const remaining = filtered.filter((event) => !featured.includes(event));
  const visibleRemaining = remaining.slice(0, visibleCount);
  const showFeatured = featured.length > 0;
  const displayedEvents = showFeatured ? visibleRemaining : filtered.slice(0, visibleCount);
  const totalEventsForMore = showFeatured ? remaining.length : filtered.length;
  const hasMoreEvents = totalEventsForMore > visibleCount;
  const nextVisibleCount = Math.min(visibleCount + 9, totalEventsForMore);

  return (
    <>
      <SEO
        title="Book Events & Literary Festivals across India"
        description="Discover upcoming book fairs, literature festivals, author talks, book launches, reading meetups, and BookTech hackathons across India."
        canonical="https://sahadhyayi.com/events"
        keywords={[
          "book events India",
          "book fairs",
          "literature festivals",
          "author events",
          "book launch",
          "reading meetups",
          "Jaipur literature festival",
          "New Delhi World book fair",
          "Kolkata book fair",
        ]}
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Sahadhyayi Events",
          description: "Discover verified book and literary events across India and online.",
          url: "https://sahadhyayi.com/events",
        }}
      />

      <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
        <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-amber-500/5">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2400&q=85"
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 z-0 h-full w-full object-cover object-[center_30%] sm:w-[65%] lg:w-[60%]"
            loading="eager"
          />
          {/* Mobile scrim for crisp legibility */}
          <div aria-hidden="true" className="absolute inset-0 z-0 bg-background/94 sm:hidden" />
          {/* Desktop gradient blend */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-r from-background via-background/88 to-background/25"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"
          />
          <div className="pointer-events-none absolute -right-24 -top-24 z-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="relative max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1.5 border-primary/30 bg-background/60 px-3 py-1">
                  <CalendarDays className="h-3.5 w-3.5" /> THE LITERARY WORLD, IRL
                </Badge>
              </div>

              <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-serif">
                Books bring us <span className="text-primary">together.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Find your next book fair, literature festival, author conversation, or reading community. Discover verified events happening across India and online.
              </p>

              <div className="mt-8 grid gap-3 rounded-2xl border border-border/70 bg-background/85 p-3 shadow-xl shadow-primary/5 backdrop-blur sm:grid-cols-[1fr_0.65fr_auto] sm:p-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search festivals, launches, authors…"
                    className="h-11 border-0 bg-muted/40 pl-10 shadow-none focus-visible:ring-1"
                    aria-label="Search events"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="City or state"
                    className="h-11 border-0 bg-muted/40 pl-10 shadow-none focus-visible:ring-1"
                    aria-label="Filter by city"
                  />
                </div>
                <Button
                  onClick={() => {
                    setQuery("");
                    setCity("");
                    setCategory("all");
                    setMode("all");
                  }}
                  variant="outline"
                  className="h-11"
                >
                  Clear filters
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"><Globe2 className="h-3.5 w-3.5 text-primary" /> Online & in-person</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"><Users className="h-3.5 w-3.5 text-primary" /> Meet fellow readers</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"><Ticket className="h-3.5 w-3.5 text-primary" /> Save your seat</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={mode === "all" ? "default" : "outline"}
                    onClick={() => setMode("all")}
                    className="rounded-full"
                  >
                    All events
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "in-person" ? "default" : "outline"}
                    onClick={() => setMode("in-person")}
                    className="rounded-full"
                  >
                    <MapPin className="mr-1 h-3.5 w-3.5" /> In person
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "online" ? "default" : "outline"}
                    onClick={() => setMode("online")}
                    className="rounded-full"
                  >
                    <Globe2 className="mr-1 h-3.5 w-3.5" /> Online
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsSuggestOpen(true)}
                  className="rounded-full gap-1.5 font-semibold bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4" /> Suggest an Event
                </Button>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Explore the calendar
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl font-serif">
                Events worth showing up for
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {loading
                  ? "Finding upcoming events…"
                  : `${filtered.length} upcoming ${filtered.length === 1 ? "event" : "events"}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((item) => (
                <Button
                  key={item.slug}
                  size="sm"
                  variant={
                    category === item.slug || category === item.id ? "default" : "outline"
                  }
                  onClick={() =>
                    setCategory(
                      category === item.slug || category === item.id
                        ? "all"
                        : categories.length
                        ? item.id
                        : item.slug
                    )
                  }
                  className="rounded-full text-xs"
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="aspect-[16/10] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-14 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">No matching events found</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Try clearing your city or category filters. Know an upcoming literary festival or book fair?
                </p>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setCity("");
                      setCategory("all");
                      setMode("all");
                    }}
                  >
                    Reset search
                  </Button>
                  <Button onClick={() => setIsSuggestOpen(true)}>Suggest an Event</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {featured.length > 0 && (
                <section className="mb-10">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold font-serif">Featured events</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        category={categoryNameById.get(event.category_id) || event.category_name}
                        userRsvp={userRsvps[event.id]}
                        onRsvp={handleRsvp}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-4 text-xl font-semibold font-serif">
                  {showFeatured ? "More upcoming events" : "Upcoming events"}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      category={categoryNameById.get(event.category_id) || event.category_name}
                      userRsvp={userRsvps[event.id]}
                      onRsvp={handleRsvp}
                    />
                  ))}
                </div>
                {hasMoreEvents && (
                  <div className="mt-8 flex justify-center">
                    <Button variant="outline" onClick={() => setVisibleCount((count) => count + 9)}>
                      Load more events
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({nextVisibleCount} of {totalEventsForMore})
                      </span>
                    </Button>
                  </div>
                )}
              </section>
            </>
          )}

          <section className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">KNOW AN EVENT?</p>
                <h3 className="mt-1 text-xl font-bold font-serif">Help readers discover it.</h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
                  Submit book fairs, lit fests, local library readings, and book club sessions. We verify and feature them on Sahadhyayi.
                </p>
              </div>
              <Button
                onClick={() => setIsSuggestOpen(true)}
                className="gap-2 font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4" /> Suggest an Event
              </Button>
            </div>
          </section>
        </main>
      </div>

      {/* Suggest Event Modal */}
      <SuggestEventDialog
        open={isSuggestOpen}
        onOpenChange={setIsSuggestOpen}
        onEventSubmitted={() => {
          // re-check if needed
        }}
      />
    </>
  );
}
