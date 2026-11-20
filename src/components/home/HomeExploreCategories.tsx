import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  PenTool,
  Sparkles,
  Bot,
  Gamepad2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface FeatureCategory {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  icon: React.ElementType;
  image: string;
  imageAlt: string;
  accentBg: string;
  accentText: string;
  cardTone: string;
  shortcuts: { label: string; href: string }[];
}

const categories: FeatureCategory[] = [
  {
    id: "discover-read",
    badge: "01 / Library",
    title: "Discover & Read",
    tagline: "Digital Library & Personal Shelf",
    description: "Browse thousands of digitized classics, read verified PDFs or EPUBs, track your reading progress, and maintain your personal bookshelf.",
    href: "/library",
    icon: BookOpen,
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Aesthetic warm library bookshelves and reading collections",
    cardTone: "bg-gradient-to-br from-[#FFFDF9] via-[#FDF8EE] to-[#FAF1E2] dark:from-[#1D1711] dark:via-[#18130E] dark:to-[#140F0B] border-[#F2DFBD] dark:border-[#3E2D1A]",
    accentBg: "bg-amber-100/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/60",
    accentText: "text-amber-800 dark:text-amber-300",
    shortcuts: [
      { label: "Digital Library", href: "/library" },
      { label: "My Bookshelf", href: "/bookshelf" },
      { label: "Publish a Book", href: "/publish" },
    ],
  },
  {
    id: "social-reading",
    badge: "02 / Community",
    title: "The Social Feed",
    tagline: "Book-Linked Reader Feed",
    description: "Share memorable quotes, post thoughts tagged to the books you're reading, discover fellow readers, and exchange literary commentary.",
    href: "/social",
    icon: Users,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Readers enjoying coffee, book discussions and reading journals",
    cardTone: "bg-gradient-to-br from-[#FFF9F6] via-[#FDF3EE] to-[#FAEDE6] dark:from-[#211614] dark:via-[#1B1110] dark:to-[#160E0D] border-[#FBD8CD] dark:border-[#4B2720]",
    accentBg: "bg-rose-100/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/60",
    accentText: "text-rose-800 dark:text-rose-300",
    shortcuts: [
      { label: "Friends Feed", href: "/social" },
      { label: "Book Reviews", href: "/social?tab=reviews" },
      { label: "Discussions", href: "/social?tab=threads" },
    ],
  },
  {
    id: "read-write",
    badge: "03 / Writing",
    title: "Read & Write",
    tagline: "Articles, Stories & Serials",
    description: "Dive into critical essays, book reflections, and original serialized fiction. Write your own articles or publish serialized short stories.",
    href: "/articles",
    icon: PenTool,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Writing desk with notebook, fountain pen and creative manuscripts",
    cardTone: "bg-gradient-to-br from-[#F6FAF6] via-[#EFF6F0] to-[#E5EFE7] dark:from-[#121E15] dark:via-[#0F1811] dark:to-[#0C140E] border-[#CFE2D2] dark:border-[#213A26]",
    accentBg: "bg-emerald-100/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/60",
    accentText: "text-emerald-800 dark:text-emerald-300",
    shortcuts: [
      { label: "Read Articles", href: "/articles" },
      { label: "Short Stories", href: "/stories" },
      { label: "Write Article", href: "/articles/write" },
    ],
  },
  {
    id: "authors-experts",
    badge: "04 / Voices",
    title: "Authors & Experts",
    tagline: "Writers, Critics & Scholars",
    description: "Explore curated profiles of classic and modern authors, literary critics, scientists, and social thinkers. Connect directly with creators.",
    href: "/authors",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Scholarly volumes, literary archives and author studies",
    cardTone: "bg-gradient-to-br from-[#F5F8FA] via-[#EDF3F7] to-[#E3EEF4] dark:from-[#111A21] dark:via-[#0D151B] dark:to-[#0A1015] border-[#C9DFED] dark:border-[#1E3444]",
    accentBg: "bg-sky-100/90 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800/60",
    accentText: "text-sky-800 dark:text-sky-300",
    shortcuts: [
      { label: "Authors Directory", href: "/authors" },
      { label: "Reviewers & Critics", href: "/reviewers-critics" },
      { label: "Author Connect", href: "/author-connect" },
    ],
  },
  {
    id: "book-expert-ai",
    badge: "05 / Intelligence",
    title: "Book Expert AI",
    tagline: "Gemini-Powered Reading Companion",
    description: "Ask deep questions about any book, unpack philosophical themes, summarize chapters, understand character arcs, and get intelligent book matches.",
    href: "/book-expert",
    icon: Bot,
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Illuminated book with contextual knowledge and AI reading insights",
    cardTone: "bg-gradient-to-br from-[#F8F5FB] via-[#F2EDF8] to-[#ECE3F4] dark:from-[#1D1424] dark:via-[#17101D] dark:to-[#130D18] border-[#E0CFE8] dark:border-[#3D2248]",
    accentBg: "bg-purple-100/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800/60",
    accentText: "text-purple-800 dark:text-purple-300",
    shortcuts: [
      { label: "Ask Book Expert", href: "/book-expert" },
      { label: "Book AI Reader", href: "/library" },
    ],
  },
  {
    id: "activity-hub",
    badge: "06 / Interactive",
    title: "Activity Hub",
    tagline: "Games, Challenges & Meetups",
    description: "Test your literary trivia knowledge with book games, embark on reading streaks, join community reading groups, and RSVP to book festivals.",
    href: "/activity",
    icon: Gamepad2,
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Luminous spark of curiosity, literary puzzles and reading challenges",
    cardTone: "bg-gradient-to-br from-[#FCF9F2] via-[#F8F3E6] to-[#F5EED8] dark:from-[#201B12] dark:via-[#19150E] dark:to-[#14110B] border-[#EADBBA] dark:border-[#3B301A]",
    accentBg: "bg-amber-100/90 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-800/60",
    accentText: "text-amber-900 dark:text-yellow-300",
    shortcuts: [
      { label: "Reading Challenges", href: "/activity?tab=challenges" },
      { label: "Literary Games", href: "/games" },
      { label: "Book Events", href: "/events" },
    ],
  },
];

export const HomeExploreCategories: React.FC = () => {
  return (
    <section
      className="home-explore-categories relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] border-t border-[#E8E8E3] dark:border-[#222824] transition-colors duration-300"
      aria-label="Explore Sahadhyayi"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>03 / Explore the platform</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Everything built for the deep reader
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Six interconnected spaces designed to discover books, connect with fellow readers, explore literary ideas, and deepen your reading journey.
            </p>
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Learn about our mission</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className={`group relative flex flex-col justify-between rounded-3xl border ${cat.cardTone} p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-black/60 overflow-hidden shadow-xs`}
              >
                <div>
                  {/* Card Visual Image Banner */}
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-5 bg-muted/40 border border-black/5 dark:border-white/5">
                    <img
                      src={cat.image}
                      alt={cat.imageAlt}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Floating badge over image */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border backdrop-blur-md bg-white/90 dark:bg-black/80 ${cat.accentBg} ${cat.accentText} shadow-xs`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1C201D] dark:text-[#F3F0E7] bg-white/95 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/5 dark:border-white/10 shadow-2xs">
                        {cat.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors leading-snug">
                    <Link to={cat.href} className="focus:outline-none">
                      {cat.title}
                    </Link>
                  </h3>
                  <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D]/90 mt-1 mb-2">
                    {cat.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-[#5D665F] dark:text-[#B0B7B1] leading-relaxed line-clamp-3">
                    {cat.description}
                  </p>
                </div>

                {/* Shortcuts & Primary CTA */}
                <div className="mt-6 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {cat.shortcuts.map((sc) => (
                      <Link
                        key={sc.label}
                        to={sc.href}
                        className="text-[11px] font-medium text-[#1C201D] dark:text-[#E2DFD8] bg-white/90 dark:bg-[#181D1A]/90 hover:bg-[#1C442D]/10 dark:hover:bg-[#D5B16D]/15 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5 transition-colors shadow-2xs"
                      >
                        {sc.label}
                      </Link>
                    ))}
                  </div>

                  <Link
                    to={cat.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] group-hover:underline"
                    aria-label={`Explore ${cat.title}`}
                  >
                    <span>Open {cat.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeExploreCategories;
