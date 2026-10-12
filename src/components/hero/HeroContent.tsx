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
      {/* Brand Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111614] border border-[#26302A] text-xs font-medium text-[#D5B16D] mb-6 tracking-wide shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-[#D5B16D]" />
        <span>The Social Reading Platform</span>
      </div>

      {/* Main Headline (Image 2 reference: "Read deeper. Connect meaningfully.") */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#F3F0E7] tracking-tight leading-[1.14] mb-5">
        Read <span className="text-[#D5B16D]">deeper.</span>
        <br />
        Connect meaningfully.
      </h1>

      {/* Supporting Description */}
      <p className="text-sm sm:text-base md:text-lg text-[#A5ADA6] leading-relaxed mb-8 max-w-lg">
        Discover books, exchange ideas, and find fellow readers who make every reading journey richer.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
        <Link
          to={primaryCta.to}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#D5B16D] hover:bg-[#e4c688] text-black text-sm sm:text-base font-semibold shadow-md shadow-[#D5B16D]/20 transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D5B16D] focus-visible:ring-offset-[#0B0D0C]"
        >
          <PrimaryIcon className="w-4 h-4 text-black" />
          <span>{primaryCta.label}</span>
          <ArrowRight className="w-4 h-4 text-black/80" />
        </Link>

        <Link
          to={secondaryCta.to}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#111614] hover:bg-[#1B241E] text-[#F3F0E7] border border-[#29332D] text-sm sm:text-base font-medium transition-all duration-200 hover:border-[#3A473E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
        >
          <span>{secondaryCta.label}</span>
        </Link>
      </div>

      {/* Social proof strip (Image 2 reference: "A community of readers, thinkers, and dreamers") */}
      <div className="mt-8 flex items-center gap-3">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full border-2 border-[#0B0D0C] bg-[#1F2F24] flex items-center justify-center text-[10px] font-bold text-[#A7F3D0]">
            S
          </div>
          <div className="w-7 h-7 rounded-full border-2 border-[#0B0D0C] bg-[#3B2C1B] flex items-center justify-center text-[10px] font-bold text-[#FDE68A]">
            A
          </div>
          <div className="w-7 h-7 rounded-full border-2 border-[#0B0D0C] bg-[#1E2E3B] flex items-center justify-center text-[10px] font-bold text-[#BAE6FD]">
            H
          </div>
          <div className="w-7 h-7 rounded-full border-2 border-[#0B0D0C] bg-[#2E1E3B] flex items-center justify-center text-[10px] font-bold text-[#E9D5FF]">
            R
          </div>
        </div>
        <span className="text-xs text-[#A5ADA6]">
          A community of readers, thinkers, and dreamers
        </span>
      </div>
    </div>
  );
};
