import React from 'react';
import HeroAtomicRings from './hero/HeroAtomicRings';
import { HeroContent } from './hero/HeroContent';
import { BookOpen } from 'lucide-react';

const AnimatedHero: React.FC = () => {
  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b border-[#E8E2D9] bg-[#FAF7F2] py-10 text-[#1C201D] transition-colors duration-300 dark:border-[#29332D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7] sm:py-14 lg:py-16"
      aria-label="Sahadhyayi home hero"
    >
      {/* The light theme is deliberately warm and airy; dark mode has its own
          restrained forest glow. These layers sit behind, never over, the orbit SVG. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-36 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#DCC79B]/25 blur-[110px] dark:bg-[#1C442D]/25" />
        <div className="absolute -bottom-40 right-[4%] h-[36rem] w-[36rem] rounded-full bg-[#C8DBCB]/55 blur-[130px] dark:bg-[#D5B16D]/[0.07]" />
        <div className="absolute right-[7%] top-[7%] h-[min(72vw,720px)] w-[min(72vw,720px)] rounded-full border border-[#1C442D]/[0.055] dark:border-[#D5B16D]/[0.08]" />
        <div className="absolute right-[10%] top-[11%] h-[min(64vw,640px)] w-[min(64vw,640px)] rounded-full border border-[#B68A35]/[0.07] dark:border-white/[0.04]" />
        <div className="absolute inset-0 opacity-[0.19] [background-image:radial-gradient(#1C442D_0.55px,transparent_0.55px)] [background-size:20px_20px] [mask-image:linear-gradient(to_right,black,transparent_82%)] dark:opacity-[0.08] dark:[background-image:radial-gradient(#D5B16D_0.55px,transparent_0.55px)]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:px-6 md:gap-8 lg:grid-cols-12 lg:gap-8 lg:px-8 xl:gap-10">
        <div className="order-1 flex justify-center lg:col-span-6 lg:justify-start">
          <HeroContent />
        </div>

        <div className="order-2 flex items-center justify-center lg:col-span-6">
          <div className="relative flex aspect-square w-full max-w-[320px] items-center justify-center sm:max-w-[410px] md:max-w-[470px] lg:max-w-[520px] xl:max-w-[590px]">
            <HeroAtomicRings size="100%" className="h-full w-full max-h-full max-w-full">
              <div className="flex h-28 w-28 select-none flex-col items-center justify-center rounded-full border border-[#D4C9BC]/80 bg-white/65 text-center shadow-[0_8px_28px_rgba(28,32,29,0.08)] backdrop-blur-md dark:border-[#38483D]/80 dark:bg-[#0B0D0C]/55 dark:shadow-[0_12px_34px_rgba(0,0,0,0.28)] sm:h-32 sm:w-32">
                <div className="relative mb-1 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#B68A35]/20 blur-md dark:bg-[#D5B16D]/25" />
                  <BookOpen className="relative h-7 w-7 text-[#1C442D] dark:text-[#F3F0E7] sm:h-8 sm:w-8" aria-hidden="true" />
                </div>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] sm:text-[10px]">
                  सहाध्यायी
                </span>
                <span className="mt-0.5 block font-serif text-xs font-bold text-[#1C201D] dark:text-[#F3F0E7] sm:text-sm">
                  Sahadhyayi
                </span>
              </div>
            </HeroAtomicRings>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;
