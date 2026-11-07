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
  Library,
  MessageCircle,
  BookMarked,
  Flame,
} from "lucide-react";

interface FeatureCategory {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
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
    accentBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    accentText: "text-emerald-700 dark:text-emerald-400",
    shortcuts: [
      { label: "Digital Library", href: "/library" },
      { label: "My Bookshelf", href: "/bookshelf" },
      { label: "Publish a Book", href: "/publish-book" },
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
    accentBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
    accentText: "text-blue-700 dark:text-blue-400",
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
    accentBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
    accentText: "text-amber-700 dark:text-amber-400",
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
    accentBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
    accentText: "text-purple-700 dark:text-purple-400",
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
    accentBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60",
    accentText: "text-rose-700 dark:text-rose-400",
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
    accentBg: "bg-amber-50/70 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/60",
    accentText: "text-yellow-800 dark:text-yellow-400",
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
                className="group relative flex flex-col justify-between rounded-2xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/40"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${cat.accentBg} ${cat.accentText} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F681C] dark:text-[#D5B16D] bg-white dark:bg-[#181C1A] px-2.5 py-1 rounded-full border border-[#E8E8E3] dark:border-[#29332D]">
                      {cat.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                    <Link to={cat.href} className="focus:outline-none">
                      {cat.title}
                    </Link>
                  </h3>
                  <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D]/90 mt-1 mb-2.5">
                    {cat.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Shortcuts & Primary CTA */}
                <div className="mt-6 pt-5 border-t border-[#E8E8E3] dark:border-[#222824]">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cat.shortcuts.map((sc) => (
                      <Link
                        key={sc.label}
                        to={sc.href}
                        className="text-[11px] font-medium text-[#1C201D] dark:text-[#E2DFD8] bg-white dark:bg-[#181D1A] hover:bg-[#EBF2EC] dark:hover:bg-[#202924] px-2.5 py-1 rounded-md border border-[#E0E0DB] dark:border-[#28322C] transition-colors"
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

