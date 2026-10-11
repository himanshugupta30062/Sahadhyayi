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
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] border-b border-[#29332D] text-[#F3F0E7]"
      aria-label="Platform Capabilities"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header (Image 2 reference) */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161D19] border border-[#29332D] text-xs font-semibold text-[#D5B16D] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#F3F0E7] tracking-tight">
              Built for deeper reading
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#A5ADA6] leading-relaxed">
              More than a library — explore the tools and experiences designed for fellow readers.
            </p>
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors self-start md:self-end group"
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
                className="group flex items-center gap-4 p-5 rounded-2xl bg-[#111614] hover:bg-[#161D19] border border-[#29332D] hover:border-[#315C43] transition-all duration-300 hover:-translate-y-0.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
              >
                {/* Glowing Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-[#161D19] group-hover:bg-[#1F2B22] border border-[#29332D] group-hover:border-[#315C43] flex items-center justify-center text-[#D5B16D] shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#F3F0E7] group-hover:text-[#D5B16D] transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#A5ADA6] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Trailing Chevron */}
                <ChevronRight className="w-4 h-4 text-[#A5ADA6] group-hover:text-[#D5B16D] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiCapabilities;
