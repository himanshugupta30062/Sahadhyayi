import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  Share2,
  Sparkles,
  Ticket,
  Users,
  Check,
  Download,
} from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CURATED_LITERARY_EVENTS, BookEvent } from "@/data/curatedEvents";
import { toast } from "sonner";

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

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

const downloadIcsFile = (event: BookEvent) => {
  const startIso = new Date(event.start_at).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endIso = event.end_at
    ? new Date(event.end_at).toISOString().replace(/-|:|\.\d\d\d/g, "")
    : new Date(new Date(event.start_at).getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const location = event.is_online ? "Online" : [event.venue, event.city].filter(Boolean).join(", ");

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sahadhyayi//Literary Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}
LOCATION:${location}
DTSTART:${startIso}
DTEND:${endIso}
URL:${event.official_source_url}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${event.slug}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  toast.success("Downloaded calendar file (.ics)");
};

export default function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<BookEvent | null>(null);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userRsvp, setUserRsvp] = useState<"attending" | "interested" | null>(null);

  // Restore RSVP for this event
  useEffect(() => {
    if (!event?.id) return;
    try {
      const stored = localStorage.getItem("sahadhyayi_event_rsvps");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[event.id]) {
          setUserRsvp(parsed[event.id]);
        }
      }
    } catch {
      // Ignore storage error
    }
  }, [event?.id]);

  const handleRsvp = (status: "attending" | "interested") => {
    if (!event?.id) return;
    const next = userRsvp === status ? null : status;
    setUserRsvp(next);

    try {
      const stored = localStorage.getItem("sahadhyayi_event_rsvps");
      const parsed = stored ? JSON.parse(stored) : {};
      if (next) {
        parsed[event.id] = next;
        toast.success(`Marked as ${next === "attending" ? "Attending" : "Interested"}!`);
      } else {
        delete parsed[event.id];
        toast.info("RSVP cancelled.");
      }
      localStorage.setItem("sahadhyayi_event_rsvps", JSON.stringify(parsed));
    } catch {
      // Ignore storage error
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event?.title || "Book Event", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Event URL copied to clipboard!");
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        // First check database
        const { data, error: queryError } = await (supabase as any)
          .from("literary_events")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .maybeSingle();

        if (active && data) {
          setEvent(data);
          const result = await (supabase as any)
            .from("literary_event_categories")
            .select("name")
            .eq("id", data.category_id)
            .maybeSingle();
          if (active) {
            setCategory(result.data?.name || "Book event");
          }
          setLoading(false);
          return;
        }

        // If not in DB, search curated events
        const curated = CURATED_LITERARY_EVENTS.find((e) => e.slug === slug);
        if (active && curated) {
          setEvent(curated);
          setCategory(curated.category_name || "Literature Festival");
          setLoading(false);
          return;
        }

        if (active) {
          setError(true);
          setEvent(null);
        }
      } catch (err) {
        console.warn("[EventDetails] Lookup error:", err);
        const curated = CURATED_LITERARY_EVENTS.find((e) => e.slug === slug);
        if (active && curated) {
          setEvent(curated);
          setCategory(curated.category_name || "Literature Festival");
          setError(false);
        } else if (active) {
          setError(true);
          setEvent(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold font-serif">Event not found</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          This event may have concluded, been rescheduled, or is awaiting publication review.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
      </main>
    );
  }

  const relatedEvents = CURATED_LITERARY_EVENTS.filter((e) => e.slug !== event.slug).slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_at,
    endDate: event.end_at || undefined,
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : event.status === "postponed"
        ? "https://schema.org/EventPostponed"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: event.is_online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    url: `https://sahadhyayi.com/events/${event.slug}`,
    image: event.image_url ? [event.image_url] : undefined,
    description: event.description || event.title,
    organizer: event.organizer_name ? { "@type": "Organization", name: event.organizer_name } : undefined,
    location: event.is_online
      ? { "@type": "VirtualLocation", url: event.registration_url || event.official_source_url }
      : {
          "@type": "Place",
          name: event.venue || event.city,
          address: {
            "@type": "PostalAddress",
            addressLocality: event.city,
            addressRegion: event.state,
            addressCountry: event.country || "India",
          },
        },
  };

  return (
    <>
      <SEO
        title={`${event.title} — Book Events & Literary Festivals`}
        description={event.description || `Details, dates, venue, and registration for ${event.title}.`}
        canonical={`https://sahadhyayi.com/events/${event.slug}`}
        image={event.image_url || undefined}
        schema={schema}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" /> All events
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 rounded-xl text-xs"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          {event.image_url && (
            <div className="relative aspect-[21/9] max-h-[460px] w-full overflow-hidden bg-muted">
              <img
                src={event.image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-medium text-xs">
                {category}
              </Badge>
              {event.featured && (
                <Badge className="gap-1 bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30">
                  <Sparkles className="h-3 w-3" /> Featured Festival
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {event.is_online ? "Virtual Stage" : event.city || "In-person"}
              </Badge>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl font-serif">
              {event.title}
            </h1>

            {/* Quick Action & RSVP Toolbar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  {event.attendees_count
                    ? `${event.attendees_count + (userRsvp ? 1 : 0)} people interested`
                    : "Be among the first to RSVP"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={userRsvp === "attending" ? "default" : "outline"}
                  className={`rounded-xl text-xs h-9 px-4 font-semibold ${
                    userRsvp === "attending" ? "shadow-sm" : ""
                  }`}
                  onClick={() => handleRsvp("attending")}
                >
                  {userRsvp === "attending" && <Check className="mr-1.5 h-3.5 w-3.5" />}
                  Attending
                </Button>
                <Button
                  size="sm"
                  variant={userRsvp === "interested" ? "default" : "outline"}
                  className="rounded-xl text-xs h-9 px-4 font-semibold"
                  onClick={() => handleRsvp("interested")}
                >
                  Interested
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs h-9 gap-1.5"
                >
                  <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Google Calendar
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadIcsFile(event)}
                  className="rounded-xl text-xs h-9 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  .ics
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <CalendarDays className="mt-1 h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Date & time</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {dateTime(event.start_at)}
                      {event.end_at && ` – ${dateTime(event.end_at)}`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <MapPin className="mt-1 h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{event.is_online ? "Online event" : "Venue"}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {event.is_online
                        ? "Join from anywhere (Virtual Link)"
                        : [event.venue, event.city, event.state, event.country].filter(Boolean).join(", ") ||
                          "Venue to be announced"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {event.organizer_name && (
              <p className="mt-5 text-sm text-muted-foreground">
                Organized by <span className="font-semibold text-foreground">{event.organizer_name}</span>
              </p>
            )}

            <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
              <h3 className="font-serif text-xl font-bold">About this event</h3>
              <p className="whitespace-pre-line leading-relaxed text-base text-muted-foreground mt-2">
                {event.description || "More event details will be shared by the organizer."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-border/70 pt-6">
              {event.registration_url && (
                <Button asChild className="rounded-xl font-semibold shadow-sm">
                  <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                    <Ticket className="mr-2 h-4 w-4" />
                    Register / Tickets
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-xl font-medium">
                <a href={event.official_source_url} target="_blank" rel="noopener noreferrer">
                  Official event source
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Related Events Rail */}
        {relatedEvents.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold tracking-tight">More Upcoming Literary Events</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {relatedEvents.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/40 transition">
                  <Link to={`/events/${item.slug}`} className="block p-4">
                    <p className="text-xs text-primary font-medium">{formatDate(item.start_at)}</p>
                    <h3 className="mt-1 font-serif text-base font-bold line-clamp-1">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.is_online ? "Online" : item.city}
                    </p>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
