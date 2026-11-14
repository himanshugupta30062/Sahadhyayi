import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight, BookOpen, Users, Feather, BrainCircuit, Compass,
  MessagesSquare, LibraryBig, Sparkles, CalendarDays,
  Trophy, Newspaper, PenLine, Network, BookMarked, Search,
  Zap, Star, TrendingUp, Award
} from "lucide-react";
import { useHomeEngagement } from '@/hooks/useHomeEngagement';

// Base pillar definitions
const basePillars = [
  { title: "Discover", eyebrow: "Find your next idea", description: "Explore books, authors, research and recommendations.", icon: Compass, tone: "bg-[#F2F6F0] dark:bg-[#142018]", ink: "text-[#315A3D] dark:text-[#B8D7B7]", links: [{ label: "Digital Library", to: "/library" }, { label: "Book Finder", to: "/discovery" }, { label: "Authors", to: "/authors" }, { label: "Research Papers", to: "/research-papers" }] },
  { title: "Connect", eyebrow: "Read together", description: "Meet fellow readers, exchange thoughts and find your people.", icon: Users, tone: "bg-[#F2F4F9] dark:bg-[#151926]", ink: "text-[#485A9A] dark:text-[#BFCBF7]", links: [{ label: "Friends Feed", to: "/social" }, { label: "Reading Groups", to: "/groups" }, { label: "Readers Map", to: "/reader-map" }, { label: "Activity & Rooms", to: "/activity" }] },
  { title: "Create", eyebrow: "Share what moves you", description: "Publish reflections, stories, reviews and original writing.", icon: Feather, tone: "bg-[#FBF4EC] dark:bg-[#241C15]", ink: "text-[#94652C] dark:text-[#E6C79A]", links: [{ label: "Articles", to: "/articles" }, { label: "Short Stories", to: "/stories" }, { label: "Write an article", to: "/articles" }, { label: "Publish a book", to: "/publish" }] },
  { title: "Grow", eyebrow: "Learn beyond the page", description: "Ask questions, challenge yourself and build a reading habit.", icon: BrainCircuit, tone: "bg-[#F7F2F8] dark:bg-[#221724]", ink: "text-[#86528D] dark:text-[#D9B7E0]", links: [{ label: "Book Expert AI", to: "/library" }, { label: "Reading Challenges", to: "/games" }, { label: "Events", to: "/events" }, { label: "Reading Journal", to: "/journal" }] },
];

// Usage-aware enhancements per tier
const tierEnhancements: Record<string, Record<string, { badge?: string; badgeIcon?: React.ReactNode; description?: string; highlightLink?: string }>> = {
  exploring: {
    Discover: { badge: 'New here?', badgeIcon: <Star className="w-3 h-3" />, description: 'Start with the Book Finder — personalized picks in seconds.', highlightLink: '/discovery' },
    Connect: { badge: 'Join the conversation', badgeIcon: <MessageSquare className="w-3 h-3" />, description: 'Drop into a reading room or explore the Reader Map.', highlightLink: '/social' },
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
  { title: "The Library", text: "A world of books to explore", to: "/library", icon: LibraryBig },
  { title: "Reader community", text: "Conversations with fellow readers", to: "/social", icon: MessagesSquare },
  { title: "Research & ideas", text: "Discover papers and knowledge", to: "/research-papers", icon: Network },
  { title: "Literary stories", text: "News, events and new voices", to: "/news", icon: Newspaper },
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
    const elements = el.querySelectorAll<HTMLElement>("[data-home-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("home-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((child) => observer.observe(child));
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
      <style>{`.home-feature-universe [data-home-reveal]{opacity:0;transform:translateY(18px);transition:opacity 650ms ease,transform 650ms cubic-bezier(.2,.7,.2,1)}.home-feature-universe [data-home-reveal].home-revealed{opacity:1;transform:translateY(0)}.home-feature-universe .home-feature-card{transition:transform 280ms ease,box-shadow 280ms ease,border-color 280ms ease}.home-feature-universe .home-feature-card:hover{transform:translateY(-4px);box-shadow:0 14px 32px rgba(20,35,24,.07)}.home-feature-universe .home-feature-link{transition:background-color 180ms ease,padding 180ms ease}.home-feature-universe .home-feature-link:hover{padding-left:14px}@media(prefers-reduced-motion:reduce){.home-feature-universe [data-home-reveal],.home-feature-universe .home-feature-card,.home-feature-universe .home-feature-link{transition:none!important;transform:none!important}}`}</style>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div data-home-reveal className="mb-10 max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[.24em] text-[#8F681C] dark:text-[#D5B16D]"><span className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]"/>Beyond the book</p>
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-[#1C201D] dark:text-[#F3F0E7]">A reading universe, <span className="text-[#1C442D] dark:text-[#D5B16D]">made for you.</span></h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#636B65] dark:text-[#A5ADA6] sm:text-base">Discover a book. Meet someone reading it. Share an idea. Follow your curiosity. Every part of Sahadhyayi connects back to the joy of reading.</p>
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

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {basePillars.map(({ title, eyebrow, description, icon: Icon, tone, ink, links }) => {
            const enhancement = tierEnhancements[tier]?.[title];
            const displayDescription = enhancement?.description ?? description;
            const highlightLink = enhancement?.highlightLink;

            return (
              <article key={title} data-home-reveal className={`home-feature-card group flex min-w-0 flex-col rounded-3xl border border-[#E5E0D8]/90 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-white/[.08] shadow-xs ${tone}`}>
                <div className="mb-5 flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-black/30 shadow-2xs ${ink}`}>
                    <Icon size={22} />
                  </div>
                  {enhancement?.badge && (
                    <span className="shrink-0 ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[.1em] bg-[#8F681C]/10 dark:bg-[#D5B16D]/10 text-[#8F681C] dark:text-[#D5B16D] border border-[#8F681C]/20 dark:border-[#D5B16D]/20">
                      {enhancement.badgeIcon}
                      {enhancement.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-[.18em] ${ink}`}>{eyebrow}</p>
                <h3 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                <p className="mt-2 min-h-[48px] text-xs sm:text-sm leading-6 text-[#5D665F] dark:text-[#B0B7B1]">{displayDescription}</p>
                <div className="mt-6 grid gap-2">
                  {links.map((link) => {
                    const isHighlighted = highlightLink && link.to === highlightLink;
                    return (
                      <Link
                        key={link.label}
                        to={link.to}
                        className={`home-feature-link group/link flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all ${
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

        <div data-home-reveal className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 sm:p-8 dark:border-[#242E28] dark:bg-[#131715] shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#8F681C] dark:text-[#D5B16D]"><Sparkles size={15}/> Reading Radar</div>
            <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl text-[#1C201D] dark:text-[#F3F0E7]">What are you in the mood to read?</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">Choose a feeling to guide your next discovery. Your selection updates the reading prompt below.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {moods.map((item) => <button key={item.label} type="button" aria-pressed={mood === item.label} onClick={() => setMood(item.label)} className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] ${mood === item.label ? "border-[#1C442D] bg-[#1C442D] text-white shadow-xs dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-stone-950 font-semibold" : "border-[#E5E0D8] bg-[#FAF9F5] text-[#1C201D] hover:bg-[#F0EDE6] dark:border-[#242E28] dark:bg-[#171C19] dark:text-[#A5ADA6] dark:hover:bg-[#202820] dark:hover:text-[#F3F0E7]"}`}>{item.emoji} {item.label}</button>)}
            </div>
            <div className="mt-5 rounded-2xl bg-[#F5F2EB] p-4 text-sm leading-relaxed text-[#35483B] dark:bg-[#18221B] dark:text-[#C7D5C8] border border-[#EBE4D8] dark:border-[#26312B]" aria-live="polite">{moodMessage}</div>
            <Link to={discoveryUrl} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-stone-950 dark:hover:bg-[#E4C688] transition-all shadow-xs hover:shadow-md">
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Explore "{mood}" recommendations</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="rounded-3xl bg-[#142318] p-6 sm:p-8 text-[#F3F0E7] dark:bg-[#111A14] border border-[#233827] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#D5B16D]"><BookMarked size={15}/> One book. Many journeys.</div>
              <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl text-white">Reading is only the beginning.</h3>
              <p className="mt-3 text-sm leading-6 text-white/75">A book can open a conversation, a new friendship, a question for AI or an idea worth writing down.</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {[["Read",BookOpen,"/library"],["Meet readers",Users,"/reader-map"],["Explore AI & books",BrainCircuit,"/library"],["Share ideas",PenLine,"/articles"]].map(([label, Icon, to]: any) => (
                <Link key={label} to={to} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.07] px-3.5 py-3 text-xs sm:text-sm font-medium hover:bg-white/[.14] transition-colors">
                  <Icon size={16} className="text-[#D5B16D] shrink-0"/>
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#8F681C] dark:text-[#D5B16D]">Your map to Sahadhyayi</p>
              <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">Explore the whole experience</h3>
            </div>
            <Link to="/about" className="hidden items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D] sm:inline-flex">
              About Sahadhyayi <ArrowUpRight size={15}/>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map(({title,text,to,icon:Icon}) => (
              <Link
                key={title}
                to={to}
                className="group rounded-3xl border border-[#E5E0D8] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#8F681C]/50 hover:shadow-lg dark:border-[#242E28] dark:bg-[#131715] dark:hover:border-[#D5B16D]/40 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-primary)/0.08)] dark:bg-[hsl(var(--brand-primary)/0.15)] flex items-center justify-center text-[#1C442D] dark:text-[#D5B16D]">
                    <Icon size={20}/>
                  </div>
                  <ArrowUpRight size={15} className="opacity-40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                </div>
                <h4 className="mt-4 font-serif font-bold text-base text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">{title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">{text}</p>
              </Link>
            ))}
          </div>
        </div>

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
