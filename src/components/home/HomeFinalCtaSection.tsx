import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';

export const HomeFinalCtaSection: React.FC = () => {
  const { user } = useAuth();

  return (
    <section
      className="home-final-cta relative isolate py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F4F3EF] dark:bg-gradient-to-br dark:from-[#0B0D0C] dark:via-[#121614] dark:to-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] border-t border-[#E8E8E3] dark:border-[#222824] overflow-hidden transition-colors duration-300"
      aria-label="Join Sahadhyayi"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#8F681C]/5 dark:bg-[#D5B16D]/10 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Cultural Origin Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#151D18] border border-[#E3DDD4] dark:border-[#28352D] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8F681C] dark:text-[#D5B16D] mb-6 shadow-xs">
          <span lang="hi" className="font-serif">सहाध्यायी</span>
          <span aria-hidden="true">·</span>
          <span>Fellow Reader</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] mb-6 leading-[1.18]">
          Ready to make reading a richer, deeper journey?
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-[#636B65] dark:text-[#A5ADA6] mb-10 max-w-2xl mx-auto leading-relaxed">
          Join readers, thinkers, and authors from around the world. Discover timeless books, ask intelligent questions with Book Expert AI, write your reflections, and connect with fellow readers who see the world through the written word.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] text-white dark:text-stone-950 font-semibold text-sm sm:text-base shadow-md shadow-[#1C442D]/20 dark:shadow-[#D5B16D]/20 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]"
          >
            <span>{user ? 'Open Your Dashboard' : 'Join the Community — It’s Free'}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/library"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#D5D8CF] hover:border-[#B7CEB7] bg-white hover:bg-[#F2F6F0] dark:border-[#2B352E] dark:hover:border-[#38483D] dark:bg-[#141A17] dark:hover:bg-[#19221D] text-[#1C201D] dark:text-[#F3F0E7] text-sm sm:text-base font-medium transition-all shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D]" />
            <span>Explore the Digital Library</span>
          </Link>
        </div>

        {/* Quiet footer signature */}
        <p className="mt-12 text-xs text-[#8B938D] dark:text-[#768078] flex items-center justify-center gap-1.5">
          <span>Crafted for lovers of literature everywhere</span>
          <span aria-hidden="true">·</span>
          <span>Open access & reader-first</span>
        </p>
      </div>
    </section>
  );
};

export default HomeFinalCtaSection;

