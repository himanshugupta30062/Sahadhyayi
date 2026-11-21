import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight, BookOpen, Users, Feather, BrainCircuit, Compass,
  MessagesSquare, LibraryBig, Sparkles, CalendarDays,
  Trophy, Newspaper, PenLine, Network, BookMarked, Search,
  Zap, Star, TrendingUp, Award
} from "lucide-react";
import { useHomeEngagement } from '@/hooks/useHomeEngagement';

// Base pillar definitions with curated editorial visuals and distinctive color identities
const basePillars = [
  {
    title: "Discover",
    eyebrow: "Find your next idea",
    category: "01 / Library & Catalogs",
    description: "Explore books, authors, research and recommendations.",
    icon: Compass,
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Warm library bookshelves filled with books and reading collections",
    tone: "bg-gradient-to-br from-[#FFFDF9] via-[#FDF7ED] to-[#FAF0E1] dark:from-[#1D1711] dark:via-[#18130E] dark:to-[#140F0B] border-[#F0DFBE] dark:border-[#3E2D1A]",
    ink: "text-[#9E5D18] dark:text-[#E8AA58]",
    pillBg: "bg-[#9E5D18]/10 text-[#9E5D18] dark:bg-[#E8AA58]/15 dark:text-[#E8AA58] border-[#9E5D18]/20 dark:border-[#E8AA58]/20",
    tag: "100% Free & Open",
    links: [
      { label: "Digital Library", to: "/library" },
      { label: "Book Finder", to: "/discovery" },
      { label: "Authors", to: "/authors" },
      { label: "Research Papers", to: "/research-papers" },
    ],
  },
  {
    title: "Connect",
    eyebrow: "Read together",
    category: "02 / Readers & Circles",
    description: "Meet fellow readers, exchange thoughts and find your people.",
    icon: Users,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Reader enjoying a book with journal, coffee and reader community",
    tone: "bg-gradient-to-br from-[#FFF9F6] via-[#FDF3EE] to-[#FAECE5] dark:from-[#211614] dark:via-[#1B1110] dark:to-[#160E0D] border-[#FAD8CD] dark:border-[#4B2720]",
    ink: "text-[#B84E38] dark:text-[#F39A86]",
    pillBg: "bg-[#B84E38]/10 text-[#B84E38] dark:bg-[#F39A86]/15 dark:text-[#F39A86] border-[#B84E38]/20 dark:border-[#F39A86]/20",
    tag: "Active Community",
    links: [
      { label: "Friends Feed", to: "/social" },
      { label: "Reading Groups", to: "/groups" },
      { label: "Readers Map", to: "/reader-map" },
      { label: "Activity & Rooms", to: "/activity" },
    ],
  },
  {
    title: "Create",
    eyebrow: "Share what moves you",
    category: "03 / Writers & Stories",
    description: "Publish reflections, stories, reviews and original writing.",
    icon: Feather,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Fountain pen and notebook open on literary writing desk",
    tone: "bg-gradient-to-br from-[#F6FAF6] via-[#EEF5EF] to-[#E5EFE7] dark:from-[#121E15] dark:via-[#0F1811] dark:to-[#0C140E] border-[#CCE0CF] dark:border-[#253D2A]",
    ink: "text-[#2B683C] dark:text-[#88C697]",
    pillBg: "bg-[#2B683C]/10 text-[#2B683C] dark:bg-[#88C697]/15 dark:text-[#88C697] border-[#2B683C]/20 dark:border-[#88C697]/20",
    tag: "Write & Publish",
    links: [
      { label: "Articles", to: "/articles" },
      { label: "Short Stories", to: "/stories" },
      { label: "Write an article", to: "/articles" },
      { label: "Publish a book", to: "/publish" },
    ],
  },
  {
    title: "Grow",
    eyebrow: "Learn beyond the page",
    category: "04 / Wisdom & Intellect",
    description: "Ask questions, challenge yourself and build a reading habit.",
    icon: BrainCircuit,
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Open book illuminated with ideas, wisdom and AI reading insights",
    tone: "bg-gradient-to-br from-[#F8F5FB] via-[#F2EDF8] to-[#ECE3F4] dark:from-[#1D1424] dark:via-[#17101D] dark:to-[#130D18] border-[#DFC9E6] dark:border-[#422549]",
    ink: "text-[#7B3D84] dark:text-[#CE94D7]",
    pillBg: "bg-[#7B3D84]/10 text-[#7B3D84] dark:bg-[#CE94D7]/15 dark:text-[#CE94D7] border-[#7B3D84]/20 dark:border-[#CE94D7]/20",
    tag: "AI Assistant",
    links: [
      { label: "Book Expert AI", to: "/library" },
      { label: "Reading Challenges", to: "/games" },
      { label: "Events", to: "/events" },
      { label: "Reading Journal", to: "/journal" },
    ],
  },
];

// Usage-aware enhancements per tier
const tierEnhancements: Record<string, Record<string, { badge?: string; badgeIcon?: React.ReactNode; description?: string; highlightLink?: string }>> = {
  exploring: {
    Discover: { badge: 'New here?', badgeIcon: <Star className="w-3 h-3" />, description: 'Start with the Book Finder — personalized picks in seconds.', highlightLink: '/discovery' },
    Connect: { badge: 'Join the conversation', badgeIcon: <MessagesSquare className="w-3 h-3" />, description: 'Drop into a reading room or explore the Reader Map.', highlightLink: '/social' },
    Create: { badge: 'Share your first thought', badgeIcon: <Feather className="w-3 h-3" />, description: 'Write a margin note or short review — no pressure.', highlightLink: '/articles' },
    Grow: { badge: 'Build a habit', badgeIcon: <TrendingUp className="w-3 h-3" />, description: 'Try a 7-day reading challenge to get started.', highlightLink: '/games' },
  },
  engaged: {
    Discover: { badge: 'Your picks await', badgeIcon: <Zap className="w-3 h-3" />, description: 'Book Expert AI learns from your reading history.', highlightLink: '/library' },
    Connect: { badge: 'Your people are here', badgeIcon: <Users className="w-3 h-3" />, description: 'Reading DNA matches you with compatible readers.', highlightLink: '/social?tab=dna' },
    Create: { badge: 'Publish your voice', badgeIcon: <PenLine className="w-3 h-3" />, description: 'Start an article or join a writing sprint.', highlightLink: '/articles' },
    Grow: { badge: 'Level up your reading', badgeIcon: <Award className="w-3 h-3" />, description: 'Seasonal challenges with community leaderboards.', highlightLink: '/games' },
  },
  power: {
    Discover: { badge: 'Power reader mode', badgeIcon: <Zap className="w-3 h-3" />, description: 'Advanced filters, custom lists, and export tools.', highlightLink: '/library' },
    Connect: { badge: 'Community leader', badgeIcon: <Award className="w-3 h-3" />, description: 'Moderate groups, host rooms, mentor new readers.', highlightLink: '/groups' },
    Create: { badge: 'Verified creator', badgeIcon: <Star className="w-3 h-3" />, description: 'Publish serialized stories, earn reader support.', highlightLink: '/publish' },
    Grow: { badge: 'Reading architect', badgeIcon: <BrainCircuit className="w-3 h-3" />, description: 'Design challenges, curate lists, shape the canon.', highlightLink: '/games' },
  },
};

const moods = [
  { label: "Inspire me", emoji: "✨", query: "inspiring" },
  { label: "Make me think", emoji: "🧠", query: "thought-provoking" },
  { label: "Help me unwind", emoji: "🌿", query: "calm" },
  { label: "Surprise me", emoji: "🎲", query: "unexpected" },
  { label: "Teach me", emoji: "🔎", query: "learning" },
];

const quickLinks = [
  {
    title: "The Library",
    text: "A world of books to explore",
    tag: "Books & Classics",
    to: "/library",
    icon: LibraryBig,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Illuminated library shelves",
    tone: "bg-gradient-to-br from-[#FFFDF9] via-[#FDF7ED] to-[#FAF0E1] dark:from-[#1D1711] dark:via-[#18130E] dark:to-[#140F0B] border-[#F0DFBE] dark:border-[#3E2D1A]",
    ink: "text-[#9E5D18] dark:text-[#E8AA58]",
  },
  {
    title: "Reader community",
    text: "Conversations with fellow readers",
    tag: "Circles & Rooms",
    to: "/social",
    icon: MessagesSquare,
    image: "https://images.unsplash.com/photo-1529148482759-b35b2825750f?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Readers gathering for conversation",
    tone: "bg-gradient-to-br from-[#FFF9F6] via-[#FDF3EE] to-[#FAECE5] dark:from-[#211614] dark:via-[#1B1110] dark:to-[#160E0D] border-[#FAD8CD] dark:border-[#4B2720]",
    ink: "text-[#B84E38] dark:text-[#F39A86]",
  },
  {
    title: "Research & ideas",
    text: "Discover papers and knowledge",
    tag: "Papers & Science",
    to: "/research-papers",
    icon: Network,
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Academic manuscripts and knowledge discovery",
    tone: "bg-gradient-to-br from-[#F5F8FA] via-[#EDF3F7] to-[#E3EEF4] dark:from-[#111A21] dark:via-[#0D151B] dark:to-[#0A1015] border-[#C9DFED] dark:border-[#1E3444]",
    ink: "text-[#2C6288] dark:text-[#7EB5DD]",
  },
  {
    title: "Literary stories",
    text: "News, events and new voices",
    tag: "Essays & Stories",
    to: "/news",
    icon: Newspaper,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Literary fiction and inspiring stories",
    tone: "bg-gradient-to-br from-[#F6FAF6] via-[#EEF5EF] to-[#E5EFE7] dark:from-[#121E15] dark:via-[#0F1811] dark:to-[#0C140E] border-[#CCE0CF] dark:border-[#253D2A]",
    ink: "text-[#2B683C] dark:text-[#88C697]",
  },
];

export default function HomeFeatureUniverse() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mood, setMood] = useState("Inspire me");
  const [searchParams] = useSearchParams();
  const { tier, trackSectionView } = useHomeEngagement();

  // Build discovery URL with mood query
  const discoveryUrl = useMemo(() => {
    const selected = moods.find((item) => item.label === mood);
    const params = new URLSearchParams(searchParams.toString());
    if (selected?.query) {
      params.set('mood', selected.query);
    }
    return `/discovery?${params.toString()}`;
  }, [mood, searchParams]);

  // Track section view for engagement
  useEffect(() => {
    trackSectionView('feature-universe');
  }, [trackSectionView]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const elements = Array.from(el.querySelectorAll<HTMLElement>("[data-home-reveal]"));
    const revealAll = () => elements.forEach((element) => element.classList.add("home-revealed"));

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("home-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const moodMessage = useMemo(() => {
    const selected = moods.find((item) => item.label === mood);
    const copy: Record<string, string> = {
      inspiring: "Find stories that lift your perspective and spark possibility.",
      "thought-provoking": "Explore books and ideas that stay with you after the last page.",
      calm: "Settle into gentle reads, thoughtful essays and quiet discoveries.",
      unexpected: "Follow a curiosity into a subject or author you have never explored.",
      learning: "Turn curiosity into knowledge with books, papers and Book Expert."
    };
    return copy[selected?.query || "inspiring"];
  }, [mood]);

  return (
    <section ref={sectionRef} className="home-feature-universe relative overflow-hidden bg-[#FAF9F5] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
      <style>{`.home-feature-universe [data-home-reveal]{opacity:0;transform:translate3d(0,16px,0);transition:opacity 560ms ease,transform 560ms cubic-bezier(.2,.7,.2,1)}.home-feature-universe [data-home-reveal].home-revealed{opacity:1;transform:translate3d(0,0,0)}.home-feature-universe .home-feature-card{transition:transform 280ms ease,box-shadow 280ms ease,border-color 280ms ease}.home-feature-universe .home-feature-card:hover{transform:translateY(-4px);box-shadow:0 14px 32px rgba(20,35,24,.07)}.home-feature-universe .home-feature-link{transition:background-color 180ms ease,padding 180ms ease}.home-feature-universe .home-feature-link:hover{padding-left:14px}@media(prefers-reduced-motion:reduce){.home-feature-universe [data-home-reveal]{opacity:1!important;transition:none!important;transform:none!important}.home-feature-universe .home-feature-card,.home-feature-universe .home-feature-link{transition:none!important;transform:none!important}}`}</style>
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6 sm:pt-10 sm:pb-16 lg:px-8">
        <div data-home-reveal className="mb-10 max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[.24em] text-[#8F681C] dark:text-[#D5B16D]">
            <span className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]"/>Beyond the book
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-[#1C201D] dark:text-[#F3F0E7]">
            A reading universe, <span className="text-[#1C442D] dark:text-[#D5B16D]">made for you.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#636B65] dark:text-[#A5ADA6] sm:text-base">
            Discover a book. Meet someone reading it. Share an idea. Follow your curiosity. Every part of Sahadhyayi connects back to the joy of reading.
          </p>
          {/* Tier indicator - subtle */}
          {tier !== 'new' && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[#8F681C] dark:text-[#D5B16D]" data-home-reveal>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8F681C]/10 dark:bg-[#D5B16D]/10 border border-[#8F681C]/20 dark:border-[#D5B16D]/20">
                {tier === 'exploring' && <Star className="w-3 h-3" />}
                {tier === 'engaged' && <Zap className="w-3 h-3" />}
                {tier === 'power' && <Award className="w-3 h-3" />}
                <span className="font-semibold capitalize">{tier} reader</span>
              </span>
              <span className="text-[10px] text-[#636B65] dark:text-[#A5ADA6]">
                {tier === 'exploring' && 'Keep exploring — personalized picks unlock soon'}
                {tier === 'engaged' && 'You\'re getting the hang of it — Reading DNA awaits'}
                {tier === 'power' && 'Welcome back — advanced tools are ready'}
              </span>
            </div>
          )}
        </div>

        {/* 4 Pillars with Distinct Color Identifiers, Images & Smooth Hover Transitions */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {basePillars.map(({ title, eyebrow, category, description, icon: Icon, image, imageAlt, tone, ink, pillBg, tag, links }) => {
            const enhancement = tierEnhancements[tier]?.[title];
            const displayDescription = enhancement?.description ?? description;
            const highlightLink = enhancement?.highlightLink;

            return (
              <article
                key={title}
                data-home-reveal
                className={`home-feature-card group flex min-w-0 flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-white/[.08] shadow-xs ${tone} overflow-hidden`}
              >
                <div>
                  {/* Card Visual Image Banner with Subtle Zoom on Hover */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-5 bg-muted/40 border border-black/5 dark:border-white/5">
                    <img
                      src={image}
                      alt={imageAlt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

                    {/* Floating Icon & Category Tag Badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md bg-white/95 dark:bg-black/85 shadow-xs border border-white/30 dark:border-white/10 ${ink}`}>
                        <Icon size={20} />
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[.12em] backdrop-blur-md bg-white/95 dark:bg-black/85 border border-black/5 dark:border-white/10 shadow-2xs ${ink}`}>
                        {enhancement?.badge ? (
                          <>
                            {enhancement.badgeIcon}
                            <span>{enhancement.badge}</span>
                          </>
                        ) : (
                          <span>{tag}</span>
                        )}
                      </span>
                    </div>

                    {/* Category Footnote in Image Scrim */}
                    <div className="absolute bottom-2.5 left-3 right-3 text-white/90 text-[10px] font-bold uppercase tracking-[0.16em] flex items-center justify-between">
                      <span>{category}</span>
                    </div>
                  </div>

                  <p className={`text-[10px] font-bold uppercase tracking-[.2em] ${ink}`}>{eyebrow}</p>
                  <h3 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">{title}</h3>
                  <p className="mt-2 min-h-[48px] text-xs sm:text-sm leading-relaxed text-[#5D665F] dark:text-[#B0B7B1]">{displayDescription}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-black/[0.08] dark:border-white/[0.08] grid gap-1.5">
                  {links.map((link) => {
                    const isHighlighted = highlightLink && link.to === highlightLink;
                    return (
                      <Link
                        key={link.label}
                        to={link.to}
                        className={`home-feature-link group/link flex items-center justify-between rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                          isHighlighted
                            ? 'bg-[#8F681C]/10 dark:bg-[#D5B16D]/10 text-[#1C442D] dark:text-[#D5B16D] border border-[#8F681C]/30 dark:border-[#D5B16D]/30 hover:bg-[#8F681C]/20 dark:hover:bg-[#D5B16D]/20'
                            : 'hover:bg-white/90 dark:hover:bg-white/[.12] hover:pl-4 text-foreground/90 hover:text-foreground border border-transparent hover:border-black/5 dark:hover:border-white/5'
                        }`}
                      >
                        <span>{link.label}</span>
                        {isHighlighted ? (
                          <Zap className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
                        ) : (
                          <ArrowUpRight size={14} className="opacity-40 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        {/* Reading Radar & One Book Many Journeys */}
        <div data-home-reveal className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 sm:p-8 dark:border-[#242E28] dark:bg-[#131715] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#8F681C] dark:text-[#D5B16D]">
                <Sparkles size={15}/> Reading Radar
              </div>
              <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl text-[#1C201D] dark:text-[#F3F0E7]">
                What are you in the mood to read?
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">
                Choose a feeling to guide your next discovery. Your selection updates the reading prompt below.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {moods.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={mood === item.label}
                    onClick={() => setMood(item.label)}
                    className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      mood === item.label
                        ? "border-[#1C442D] bg-[#1C442D] text-white ring-2 ring-[#1C442D]/20 shadow-xs dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-stone-950 dark:ring-[#D5B16D]/30 font-semibold"
                        : "border-[#E5E0D8] bg-[#FAF9F5] text-[#1C201D] hover:bg-[#F0EDE6] dark:border-[#242E28] dark:bg-[#171C19] dark:text-[#A5ADA6] dark:hover:bg-[#202820] dark:hover:text-[#F3F0E7]"
                    }`}
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-[#F7F4EC] p-4 text-sm leading-relaxed text-[#35483B] dark:bg-[#151D17] dark:text-[#C7D5C8] border border-[#E9E2D5] dark:border-[#223126] transition-all" aria-live="polite">
                <span className="font-serif italic mr-1">“</span>
                {moodMessage}
                <span className="font-serif italic ml-1">”</span>
              </div>
            </div>
            <Link
              to={discoveryUrl}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-stone-950 dark:hover:bg-[#E4C688] transition-all shadow-xs hover:shadow-md self-start"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Explore "{mood}" recommendations</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#122016] via-[#0E1B12] to-[#0A140D] p-6 sm:p-8 text-[#F3F0E7] border border-[#233B29] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#D5B16D]">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <BookMarked size={15}/> One book. Many journeys.
              </div>
              <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl text-white">
                Reading is only the beginning.
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/75">
                A book can open a conversation, a new friendship, a question for AI or an idea worth writing down.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {[
                ["Read", BookOpen, "/library"],
                ["Meet readers", Users, "/reader-map"],
                ["Explore AI & books", BrainCircuit, "/library"],
                ["Share ideas", PenLine, "/articles"]
              ].map(([label, Icon, to]: any) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.08] px-3.5 py-3 text-xs sm:text-sm font-medium hover:bg-white/[.15] hover:border-white/20 transition-all duration-200 group/tile"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={16} className="text-[#D5B16D] shrink-0"/>
                    <span className="truncate">{label}</span>
                  </div>
                  <ArrowUpRight size={13} className="text-white/40 group-hover/tile:text-white group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Feature Cards: Explore the whole experience with images and color themes */}
        <div className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#8F681C] dark:text-[#D5B16D]">
                Your map to Sahadhyayi
              </p>
              <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                Explore the whole experience
              </h3>
            </div>
            <Link to="/about" className="hidden items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D] sm:inline-flex">
              About Sahadhyayi <ArrowUpRight size={15}/>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map(({ title, text, tag, to, icon: Icon, image, imageAlt, tone, ink }) => (
              <Link
                key={title}
                to={to}
                className={`group rounded-3xl border ${tone} p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-black/50 shadow-xs flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 bg-muted/40 border border-black/5 dark:border-white/5">
                    <img
                      src={image}
                      alt={imageAlt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute top-2.5 left-2.5">
                      <div className={`w-9 h-9 rounded-xl backdrop-blur-md bg-white/90 dark:bg-black/80 flex items-center justify-center border border-white/20 dark:border-white/10 ${ink} shadow-2xs`}>
                        <Icon size={18}/>
                      </div>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-7 h-7 rounded-full backdrop-blur-md bg-white/90 dark:bg-black/80 flex items-center justify-center border border-black/5 dark:border-white/10 text-[#1C201D] dark:text-[#F3F0E7]">
                        <ArrowUpRight size={14} className="opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                      </div>
                    </div>
                    {tag && (
                      <div className="absolute bottom-2 left-2.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-md bg-white/90 dark:bg-black/80 text-[#1C201D] dark:text-[#F3F0E7] border border-white/20 dark:border-white/10">
                          {tag}
                        </span>
                      </div>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-base text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                    {title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
                    {text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Banner */}
        <div data-home-reveal className="mt-14 flex flex-col gap-4 rounded-3xl border border-[#E5E0D8] bg-[#F5F2EB] p-6 sm:p-8 dark:border-[#242E28] dark:bg-[#131715] sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div>
            <p className="font-serif font-bold text-lg text-[#1C201D] dark:text-[#F3F0E7]">Stay curious, together.</p>
            <p className="mt-1 text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6]">Find upcoming literary events and challenges to keep your reading alive.</p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link to="/events" className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1C201D] hover:bg-[#F2EFE8] dark:border-[#242E28] dark:bg-[#171C19] dark:text-[#F3F0E7] dark:hover:bg-[#202820] transition-colors shadow-2xs">
              <CalendarDays size={15}/> Events
            </Link>
            <Link to="/games" className="inline-flex items-center gap-2 rounded-full bg-[#1C442D] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-stone-950 dark:hover:bg-[#E4C688] transition-all shadow-2xs hover:shadow-sm">
              <Trophy size={15}/> Challenges
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
