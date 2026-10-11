import React from "react";
import { BookOpen } from "lucide-react";
import HeroAtomicRings from "./hero/HeroAtomicRings";
import { HeroContent } from "./hero/HeroContent";

const AnimatedHero: React.FC = () => {
  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] flex items-center bg-[#0B0D0C] text-[#F3F0E7] overflow-hidden py-12 sm:py-16 lg:py-20 border-b border-[#29332D]"
      aria-label="Sahadhyayi Hero"
    >
      {/* Subtle atmospheric ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-950/15 blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] rounded-full bg-[#D5B16D]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & CTAs (stacked on mobile, left-aligned on desktop) */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-start order-1">
            <HeroContent />
          </div>

          {/* Right Column: Signature Animated Atomic Rings */}
          <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center order-2">
            <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[580px] aspect-square flex items-center justify-center">
              <HeroAtomicRings size="100%" className="w-full h-full max-w-full max-h-full">
                {/* Center Core Brand Sigil: Illuminated Open Book with glow (Image 2 reference) */}
                <div className="text-center p-3 select-none pointer-events-none flex flex-col items-center justify-center">
                  <div className="relative mb-1 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#D5B16D]/30 blur-md" />
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#F3F0E7] relative drop-shadow-[0_0_14px_rgba(213,177,109,0.8)]" />
                  </div>
                  <span className="block text-[9px] sm:text-[11px] uppercase tracking-[0.24em] text-[#D5B16D] font-semibold">
                    सहाध्यायी
                  </span>
                  <span className="block text-xs sm:text-sm font-serif font-bold text-[#F3F0E7] mt-0.5">
                    Sahadhyayi
                  </span>
                </div>
              </HeroAtomicRings>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;
