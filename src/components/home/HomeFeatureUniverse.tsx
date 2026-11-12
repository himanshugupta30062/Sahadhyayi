import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, BookOpen, Users, Feather, BrainCircuit, Compass,
  MessagesSquare, LibraryBig, Sparkles, CalendarDays,
  Trophy, Newspaper, PenLine, Network, BookMarked
} from "lucide-react";

const pillars = [
  { title: "Discover", eyebrow: "Find your next idea", description: "Explore books, authors, research and recommendations.", icon: Compass, tone: "bg-[#EAF1E5] dark:bg-[#18231B]", ink: "text-[#315A3D] dark:text-[#B8D7B7]", links: [{ label: "Digital Library", to: "/library" }, { label: "Book Finder", to: "/discovery" }, { label: "Authors", to: "/authors" }, { label: "Research Papers", to: "/research-papers" }] },
  { title: "Connect", eyebrow: "Read together", description: "Meet fellow readers, exchange thoughts and find your people.", icon: Users, tone: "bg-[#E9ECF8] dark:bg-[#191D2B]", ink: "text-[#485A9A] dark:text-[#BFCBF7]", links: [{ label: "Friends Feed", to: "/social" }, { label: "Reading Groups", to: "/groups" }, { label: "Readers Map", to: "/reader-map" }, { label: "Activity & Rooms", to: "/activity" }] },
  { title: "Create", eyebrow: "Share what moves you", description: "Publish reflections, stories, reviews and original writing.", icon: Feather, tone: "bg-[#F6EBDD] dark:bg-[#2A2118]", ink: "text-[#94652C] dark:text-[#E6C79A]", links: [{ label: "Articles", to: "/articles" }, { label: "Short Stories", to: "/stories" }, { label: "Write an article", to: "/articles" }, { label: "Publish a book", to: "/publish" }] },
  { title: "Grow", eyebrow: "Learn beyond the page", description: "Ask questions, challenge yourself and build a reading habit.", icon: BrainCircuit, tone: "bg-[#F1E8F3] dark:bg-[#281D2A]", ink: "text-[#86528D] dark:text-[#D9B7E0]", links: [{ label: "Book Expert AI", to: "/library" }, { label: "Reading Challenges", to: "/games" }, { label: "Events", to: "/events" }, { label: "Reading Journal", to: "/journal" }] },
];

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
  const [mood, setMood] = useState("Inspire me");
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
    <section className="relative overflow-hidden bg-[#FAFAF8] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-[#718071] dark:text-[#D5B16D]"><span className="h-px w-7 bg-[#B68A35]"/>Beyond the book</p>
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">A reading universe, <span className="text-[#54765B] dark:text-[#D5B16D]">made for you.</span></h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#636B65] dark:text-[#A5ADA6] sm:text-base">Discover a book. Meet someone reading it. Share an idea. Follow your curiosity. Every part of Sahadhyayi connects back to the joy of reading.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pillars.map(({ title, eyebrow, description, icon: Icon, tone, ink, links }) => (
            <article key={title} className={`group flex min-w-0 flex-col rounded-3xl border border-black/[.05] p-5 transition-transform duration-300 hover:-translate-y-1 dark:border-white/[.08] sm:p-6 ${tone}`}>
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 dark:bg-black/20 ${ink}`}><Icon size={23}/></div>
              <p className={`text-[10px] font-bold uppercase tracking-[.16em] ${ink}`}>{eyebrow}</p>
              <h3 className="mt-1 font-serif text-2xl font-bold">{title}</h3>
              <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#5D665F] dark:text-[#B0B7B1]">{description}</p>
              <div className="mt-5 grid gap-1.5">
                {links.map((link) => <Link key={link.label} to={link.to} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/70 dark:hover:bg-white/[.06]">{link.label}<ArrowUpRight size={14} className="opacity-50"/></Link>)}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-[#E4E6DE] bg-white p-6 dark:border-[#29332D] dark:bg-[#111614] sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#718071] dark:text-[#D5B16D]"><Sparkles size={15}/> Reading Radar</div>
            <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">What are you in the mood to read?</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">Choose a feeling to guide your next discovery. Your selection updates the reading prompt below.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {moods.map((item) => <button key={item.label} type="button" aria-pressed={mood === item.label} onClick={() => setMood(item.label)} className={`rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A35] ${mood === item.label ? "border-[#315A3D] bg-[#315A3D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#101510]" : "border-[#DDE2D8] bg-[#FAFAF8] hover:bg-[#EEF3EA] dark:border-[#29332D] dark:bg-[#171C19] dark:hover:bg-[#202820]"}>{item.emoji} {item.label}</button>)}
            </div>
            <div className="mt-5 rounded-2xl bg-[#F3F5EF] p-4 text-sm leading-6 text-[#425246] dark:bg-[#1A241C] dark:text-[#C7D5C8]" aria-live="polite">{moodMessage}</div>
            <Link to="/discovery" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#255438] dark:bg-[#D5B16D] dark:text-[#101510] dark:hover:bg-[#E4C688]">Explore recommendations <ArrowUpRight size={16}/></Link>
          </div>
          <div className="rounded-3xl bg-[#1C2B21] p-6 text-[#F3F0E7] dark:bg-[#172019] sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#D5B16D]"><BookMarked size={15}/> One book. Many journeys.</div>
            <h3 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">Reading is only the beginning.</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">A book can open a conversation, a new friendship, a question for AI or an idea worth writing down.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[["Read",BookOpen,"/library"],["Meet readers",Users,"/reader-map"],["Explore AI & books",BrainCircuit,"/library"],["Share ideas",PenLine,"/articles"]].map(([label, Icon, to]: any) => <Link key={label} to={to} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-sm hover:bg-white/[.12]"><Icon size={16} className="text-[#D5B16D]"/>{label}</Link>)}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#718071] dark:text-[#D5B16D]">Your map to Sahadhyayi</p><h3 className="mt-1 font-serif text-2xl font-bold">Explore the whole experience</h3></div><Link to="/about" className="hidden items-center gap-1 text-sm font-semibold text-[#315A3D] hover:underline dark:text-[#D5B16D] sm:inline-flex">About Sahadhyayi <ArrowUpRight size={15}/></Link></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map(({title,text,to,icon:Icon}) => <Link key={title} to={to} className="group rounded-2xl border border-[#E4E6DE] bg-white p-4 transition-all hover:border-[#B9CDB7] hover:shadow-sm dark:border-[#29332D] dark:bg-[#111614] dark:hover:border-[#425746]"><div className="flex items-center justify-between"><Icon size={19} className="text-[#66836B] dark:text-[#D5B16D]"/><ArrowUpRight size={15} className="opacity-40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div><h4 className="mt-4 font-semibold">{title}</h4><p className="mt-1 text-xs leading-5 text-[#636B65] dark:text-[#A5ADA6]">{text}</p></Link>)}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-[#E4E6DE] bg-[#F3F5EF] p-5 dark:border-[#29332D] dark:bg-[#121815] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><p className="font-semibold">Stay curious, together.</p><p className="mt-1 text-sm text-[#636B65] dark:text-[#A5ADA6]">Find upcoming literary events and challenges to keep your reading alive.</p></div>
          <div className="flex flex-wrap gap-2"><Link to="/events" className="inline-flex items-center gap-2 rounded-full border border-[#D5DDD1] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#EAF2E8] dark:border-[#29332D] dark:bg-[#171C19] dark:hover:bg-[#202820]"><CalendarDays size={15}/> Events</Link><Link to="/games" className="inline-flex items-center gap-2 rounded-full bg-[#1C442D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#255438] dark:bg-[#D5B16D] dark:text-[#101510]"><Trophy size={15}/> Challenges</Link></div>
        </div>
      </div>
    </section>
  );
}
