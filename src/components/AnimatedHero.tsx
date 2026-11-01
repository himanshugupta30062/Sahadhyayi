import React from "react";
import HeroAtomicRings from "./hero/HeroAtomicRings";
import { HeroContent } from "./hero/HeroContent";
import { BookOpen } from "lucide-react";
import HomeFloatingBooks from "./home/HomeFloatingBooks";

const AnimatedHero: React.FC = () => {
  return (
    <section
      className="relative min-h-[calc(100svh-4rem)] flex items-center bg-[#FAFAF8] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] overflow-hidden py-10 sm:py-14 lg:py-20 transition-colors duration-300"
      aria-label="Sahadhyayi Hero"
    >
      {/* A quiet paper-toned canvas keeps the animated rings as the hero focal point. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <HomeFloatingBooks placement="hero" />
        <div className="hero-light-wash absolute inset-0 dark:hidden" />
        <div className="absolute top-1/3 left-1/2 hidden h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-[#1A1E1C]/40 blur-[140px] dark:block" />
        <div className="absolute right-12 top-1/4 hidden h-[400px] w-[400px] rounded-full bg-[#D5B16D]/10 blur-[130px] dark:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_72%_50%,rgba(213,177,109,0.035),transparent_50%)] dark:block" />
        <style>{`
          .hero-light-wash {
            background: linear-gradient(118deg, #F8F8F2 0%, #F7F6EF 54%, #F3F6F0 100%);
          }
        `}</style>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          {/* Left Column: Editorial Headline & CTAs (stacked on mobile, left-aligned on desktop) */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start order-1">
            <HeroContent />
          </div>

          {/* Right Column: Original Signature Animated Atomic Rings */}
          <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center order-2">
            <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[580px] aspect-square flex items-center justify-center">
              <HeroAtomicRings size="100%" className="w-full h-full max-w-full max-h-full">
                {/* Center Core Brand Sigil — kept inside the animated rings */}
                <div className="text-center p-3 select-none pointer-events-none flex flex-col items-center justify-center">
                  <div className="relative mb-2 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#B68A35]/20 dark:bg-[#D5B16D]/30 blur-md" />
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#1C442D] dark:text-[#F3F0E7] relative drop-shadow-[0_0_12px_rgba(28,68,45,0.4)] dark:drop-shadow-[0_0_14px_rgba(213,177,109,0.8)]" aria-hidden="true" />
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-2">
                    <span aria-hidden="true" className="h-px w-3 sm:w-4 bg-gradient-to-r from-transparent to-[#B68A35]/80 dark:to-[#D5B16D]/80" />
                    <span
                      lang="hi"
                      className="block text-[12px] sm:text-[15px] leading-none font-semibold text-[#8F681C] dark:text-[#D5B16D]"
                      style={{ fontFamily: "'Noto Serif Devanagari', 'Nirmala UI', 'Mangal', serif", letterSpacing: "0.01em" }}
                    >
                      सहाध्यायी
                    </span>
                    <span aria-hidden="true" className="h-px w-3 sm:w-4 bg-gradient-to-l from-transparent to-[#B68A35]/80 dark:to-[#D5B16D]/80" />
                  </div>
                  <span className="block text-[10px] sm:text-xs font-serif font-bold tracking-[0.08em] text-[#1C201D] dark:text-[#F3F0E7] mt-1">
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
