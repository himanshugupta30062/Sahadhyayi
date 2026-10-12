import React from "react";
import HeroAtomicRings from "./hero/HeroAtomicRings";
import { HeroContent } from "./hero/HeroContent";
import Hero3DBook from "./hero/Hero3DBook";

const AnimatedHero: React.FC = () => {
  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] flex items-center bg-[#0B0D0C] text-[#F3F0E7] overflow-hidden py-10 sm:py-14 lg:py-20 border-b border-[#29332D]"
      aria-label="Sahadhyayi Hero"
    >
      {/* Subtle atmospheric ambient glow matching reference design */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-[#1A1E1C]/40 blur-[140px]" />
        <div className="absolute top-1/4 right-12 w-[400px] h-[400px] rounded-full bg-[#D5B16D]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          {/* Left Column: Editorial Headline & CTAs (stacked on mobile, left-aligned on desktop) */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-start order-1">
            <HeroContent />
          </div>

          {/* Right Column: Signature Animated Atomic Rings with 3D Open Book */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center order-2 w-full">
            <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] aspect-square flex items-center justify-center mx-auto">
              <HeroAtomicRings size="100%" className="w-full h-full max-w-full max-h-full">
                {/* Center Core: Realistic 3D Open Book matching the reference design */}
                <Hero3DBook />
              </HeroAtomicRings>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;
