import React from "react";
import HeroAtomicRings from "./hero/HeroAtomicRings";
import { HeroContent } from "./hero/HeroContent";
import { BookOpen } from "lucide-react";
import HomeFloatingBooks from "./home/HomeFloatingBooks";

const AnimatedHero: React.FC = () => {
  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] flex items-center bg-[#F8F8F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] overflow-hidden py-10 sm:py-14 lg:py-20 transition-colors duration-300"
      aria-label="Sahadhyayi Hero"
    >
      {/* Theme atmosphere: gently drifting colour in light mode; original forest glow in dark mode. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <HomeFloatingBooks placement="hero" />
        <div className="hero-light-wash absolute inset-0 dark:hidden" />
        <div className="hero-light-aurora hero-light-aurora-one absolute -left-28 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#CFE6CE]/75 blur-[100px] dark:hidden" />
        <div className="hero-light-aurora hero-light-aurora-two absolute -right-32 top-[4%] h-[34rem] w-[34rem] rounded-full bg-[#F0DDB5]/65 blur-[110px] dark:hidden" />
        <div className="hero-light-aurora hero-light-aurora-three absolute bottom-[-13rem] left-[28%] h-[30rem] w-[30rem] rounded-full bg-[#D5E2F7]/65 blur-[110px] dark:hidden" />
        <div className="absolute inset-0 opacity-[0.2] dark:hidden [background-image:radial-gradient(rgba(36,68,45,0.22)_0.7px,transparent_0.7px)] [background-size:24px_24px] [mask-image:linear-gradient(to_right,black,transparent_88%)]" />
        <span className="hero-light-mote absolute left-[12%] top-[24%] h-2 w-2 rounded-full bg-[#7CA785]/60 blur-[1px] dark:hidden" />
        <span className="hero-light-mote hero-light-mote-two absolute left-[42%] top-[15%] h-1.5 w-1.5 rounded-full bg-[#C29A4C]/65 dark:hidden" />
        <span className="hero-light-mote hero-light-mote-three absolute right-[14%] top-[28%] h-2 w-2 rounded-full bg-[#7C9AC8]/65 blur-[1px] dark:hidden" />
        <span className="hero-light-mote hero-light-mote-four absolute right-[24%] bottom-[16%] h-1.5 w-1.5 rounded-full bg-[#C29A4C]/60 dark:hidden" />
        <span className="hero-light-mote hero-light-mote-five absolute left-[22%] bottom-[17%] h-1.5 w-1.5 rounded-full bg-[#7CA785]/60 dark:hidden" />
        <div className="absolute top-1/3 left-1/2 hidden h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-[#1A1E1C]/40 blur-[140px] dark:block" />
        <div className="absolute right-12 top-1/4 hidden h-[400px] w-[400px] rounded-full bg-[#D5B16D]/10 blur-[130px] dark:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_72%_50%,rgba(213,177,109,0.035),transparent_50%)] dark:block" />
        <style>{`
          @keyframes sahadhyayiLightWash {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 45%; }
          }
          @keyframes sahadhyayiAuroraDrift {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(24px, -18px, 0) scale(1.06); }
          }
          @keyframes sahadhyayiMoteFloat {
            0%, 100% { opacity: 0.35; transform: translate3d(0, 0, 0); }
            50% { opacity: 0.85; transform: translate3d(0, -13px, 0); }
          }
          .hero-light-wash {
            background: linear-gradient(118deg, #F8F8F2 0%, #F0F7EF 32%, #FFF8EB 67%, #F2F6F5 100%);
            background-size: 180% 180%;
            animation: sahadhyayiLightWash 28s ease-in-out infinite;
          }
          .hero-light-aurora { animation: sahadhyayiAuroraDrift 19s ease-in-out infinite; }
          .hero-light-aurora-two { animation-delay: -8s; }
          .hero-light-aurora-three { animation-delay: -13s; }
          .hero-light-mote { animation: sahadhyayiMoteFloat 7s ease-in-out infinite; }
          .hero-light-mote-two { animation-delay: -2s; }
          .hero-light-mote-three { animation-delay: -4s; }
          .hero-light-mote-four { animation-delay: -5.5s; }
          .hero-light-mote-five { animation-delay: -1s; }
          @media (prefers-reduced-motion: reduce) {
            .hero-light-wash, .hero-light-aurora, .hero-light-mote { animation: none; }
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
                  <div className="relative mb-1 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#B68A35]/20 dark:bg-[#D5B16D]/30 blur-md" />
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#1C442D] dark:text-[#F3F0E7] relative drop-shadow-[0_0_12px_rgba(28,68,45,0.4)] dark:drop-shadow-[0_0_14px_rgba(213,177,109,0.8)]" aria-hidden="true" />
                  </div>
                  <span className="block text-[9px] sm:text-[11px] uppercase tracking-[0.24em] text-[#B68A35] dark:text-[#D5B16D] font-semibold">
                    सहाध्यायी
                  </span>
                  <span className="block text-xs sm:text-sm font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] mt-0.5">
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
