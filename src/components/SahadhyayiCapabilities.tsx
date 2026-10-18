import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, PenTool, Gamepad2, ArrowRight, Sparkles, ChevronRight } from "lucide-react";

interface CapabilityItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const capabilities: CapabilityItem[] = [
  {
    id: "reader-map",
    title: "Local Reader Map",
    tagline: "Community nearby",
    description: "Discover readers in your city, see what is read around you, and find fellow book lovers.",
    href: "/map",
    icon: MapPin,
  },
  {
    id: "author-connect",
    title: "Author Connect",
    tagline: "Direct connection",
    description: "Follow author profiles, upcoming discussions, and discover works curated by authors.",
    href: "/authors",
    icon: Calendar,
  },
  {
    id: "articles-publishing",
    title: "Articles & Editorial",
    tagline: "Literary essays",
    description: "Publish your reflections, read thoughtful book essays, and join in-depth analyses.",
    href: "/articles",
    icon: PenTool,
  },
  {
    id: "literary-games",
    title: "Quizzes & Challenges",
    tagline: "Reading games",
    description: "Test your literary knowledge with book trivia and celebrate reading milestones.",
    href: "/games",
    icon: Gamepad2,
  },
];

export const SahadhyayiCapabilities: React.FC = () => {
  return (
    <section
      className="home-capabilities relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FBF6E9] dark:bg-[#0B0D0C] border-b border-[#EADFC7] dark:border-[#29332D] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300 overflow-hidden"
      aria-label="Platform Capabilities"
    >
      <style>{`
        @keyframes homeCapabilitiesGlowDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-16px, 14px, 0) scale(1.04); }
        }
        .home-capabilities-glow { animation: homeCapabilitiesGlowDrift 26s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .home-capabilities-glow { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
        <div className="home-capabilities-glow absolute right-[4%] top-[-8rem] h-80 w-80 rounded-full bg-[#F0D7A0]/45 blur-[100px]" />
        <div className="home-capabilities-glow absolute -left-24 bottom-[-10rem] h-72 w-72 rounded-full bg-[#DCE9D1]/65 blur-[90px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header (Image 2 reference) */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2EC] dark:bg-[#161D19] border border-[#C8DBCB] dark:border-[#29332D] text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Built for deeper reading
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              More than a library — explore the tools and experiences designed for fellow readers.
            </p>
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#143221] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>See all features</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 4 Horizontal Row Cards matching Image 2 reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#111413] hover:bg-[#F5EEDC] dark:hover:bg-[#161A18] border border-[#EADFC7] dark:border-[#26302A] hover:border-[#BDA56B]/55 dark:hover:border-[#D5B16D]/50 transition-all duration-300 hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]"
              >
                {/* Glowing Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-[#F5EEDC] dark:bg-[#161A18] group-hover:bg-[#EBF2EC] dark:group-hover:bg-[#1E1C15] border border-[#EADFC7] dark:border-[#26302A] group-hover:border-[#1C442D]/30 dark:group-hover:border-[#D5B16D]/40 flex items-center justify-center text-[#1C442D] dark:text-[#D5B16D] shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Trailing Chevron */}
                <ChevronRight className="w-4 h-4 text-[#636B65] dark:text-[#A5ADA6] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiCapabilities;
