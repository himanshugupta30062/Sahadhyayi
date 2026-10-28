import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import { ArrowRight, BookOpen, LayoutDashboard, Sparkles } from "lucide-react";

export const HeroContent: React.FC = () => {
  const { user } = useAuth();

  const primaryCta = user
    ? { to: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard }
    : { to: "/library", label: "Explore Library", icon: BookOpen };

  const secondaryCta = user
    ? { to: "/social", label: "Community Feed" }
    : { to: "/signup", label: "Join the community" };

  const PrimaryIcon = primaryCta.icon;

  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-xl mx-auto lg:mx-0">
      {/* Brand Pill matching reference design */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#111614] border border-[#E8E2D9] dark:border-[#26302A] text-xs font-semibold uppercase tracking-widest text-[#8F681C] dark:text-[#D5B16D] mb-6 shadow-2xs dark:shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-[#8F681C] dark:text-[#D5B16D]" />
        <span>A Reading Community</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight leading-[1.14] mb-5">
        Read <span className="text-[#8F681C] dark:text-[#D5B16D]">deeper.</span>
        <br />
        Connect meaningfully.
      </h1>

      {/* Supporting Description */}
      <p className="text-sm sm:text-base md:text-lg text-[#636B65] dark:text-[#A5ADA6] leading-relaxed mb-8 max-w-lg">
        Discover books, exchange ideas, join reading groups, and find fellow readers who make every reading journey richer.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
        <Link
          to={primaryCta.to}
          aria-label={primaryCta.label}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 text-sm sm:text-base font-semibold shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20 transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] focus-visible:ring-offset-[#FAF7F2] dark:focus-visible:ring-offset-[#0B0D0C]"
        >
          <PrimaryIcon className="w-4 h-4 text-white dark:text-stone-950" />
          <span>{primaryCta.label}</span>
          <ArrowRight className="w-4 h-4 text-white/90 dark:text-stone-950/80" />
        </Link>

        <Link
          to={secondaryCta.to}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-[#F4EFEA] text-[#1C201D] border border-[#E8E2D9] hover:border-[#D4C9BC] dark:bg-[#111614] dark:hover:bg-[#1B241E] dark:text-[#F3F0E7] dark:border-[#29332D] text-sm sm:text-base font-medium transition-all duration-200 hover:border-[#3A473E] shadow-2xs dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
        >
          <span>{secondaryCta.label}</span>
        </Link>
      </div>

      {/* Product-value strip: communicate real features without implying unverified user activity */}
      <div
        className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6]"
        aria-label="Explore Sahadhyayi features"
      >
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
          Curated books
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
          Shared ideas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ArrowRight className="h-4 w-4 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
          Reading groups
        </span>
      </div>
    </div>
  );
};
