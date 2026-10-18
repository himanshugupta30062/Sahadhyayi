import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { ArrowRight, BookOpen, LayoutDashboard, Sparkles, Users, PenTool } from 'lucide-react';

export const HeroContent: React.FC = () => {
  const { user } = useAuth();

  const primaryCta = user
    ? { to: '/dashboard', label: 'Go to Dashboard', icon: LayoutDashboard }
    : { to: '/library', label: 'Explore Library', icon: BookOpen };

  const secondaryCta = user
    ? { to: '/social', label: 'Community Feed' }
    : { to: '/signup', label: 'Join the community' };

  const PrimaryIcon = primaryCta.icon;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4C9BC] bg-white/75 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#785715] shadow-[0_2px_10px_rgba(28,32,29,0.035)] backdrop-blur-sm dark:border-[#29332D] dark:bg-[#111614]/85 dark:text-[#D5B16D] dark:shadow-none sm:mb-6">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span>A reading community</span>
      </div>

      <h1 className="mb-5 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#1C201D] dark:text-[#F3F0E7] sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
        Read <span className="text-[#8F681C] dark:text-[#D5B16D]">deeper.</span>
        <br />
        Connect meaningfully.
      </h1>

      <p className="mb-7 max-w-lg text-base leading-7 text-[#636B65] dark:text-[#A5ADA6] sm:mb-8 sm:text-lg sm:leading-8">
        Discover books, exchange ideas, join reading groups, and find fellow readers who make every reading journey richer.
      </p>

      <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-3.5">
        <Link
          to={primaryCta.to}
          aria-label={primaryCta.label}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1C442D] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(28,68,45,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#143221] hover:shadow-[0_12px_28px_rgba(28,68,45,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:shadow-[0_8px_22px_rgba(213,177,109,0.12)] dark:hover:bg-[#E4C17B] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C] sm:w-auto sm:px-7 sm:text-base"
        >
          <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
          <span>{primaryCta.label}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <Link
          to={secondaryCta.to}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#D4C9BC] bg-white/75 px-6 py-3.5 text-sm font-medium text-[#1C201D] shadow-[0_2px_10px_rgba(28,32,29,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#1C442D]/35 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] dark:border-[#29332D] dark:bg-[#111614]/85 dark:text-[#F3F0E7] dark:shadow-none dark:hover:border-[#D5B16D]/45 dark:hover:bg-[#161D19] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C] sm:w-auto sm:px-7 sm:text-base"
        >
          <span>{secondaryCta.label}</span>
        </Link>
      </div>

      {/* Feature labels, not fabricated testimonials or audience counts. */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCD5C9] bg-white/55 px-3 py-1.5 text-xs font-medium text-[#4F5D53] dark:border-[#29332D] dark:bg-[#111614]/70 dark:text-[#B9C9BC]">
          <BookOpen className="h-3.5 w-3.5 text-[#1C442D] dark:text-[#D5B16D]" aria-hidden="true" />
          Discover books
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCD5C9] bg-white/55 px-3 py-1.5 text-xs font-medium text-[#4F5D53] dark:border-[#29332D] dark:bg-[#111614]/70 dark:text-[#B9C9BC]">
          <PenTool className="h-3.5 w-3.5 text-[#1C442D] dark:text-[#D5B16D]" aria-hidden="true" />
          Follow authors
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCD5C9] bg-white/55 px-3 py-1.5 text-xs font-medium text-[#4F5D53] dark:border-[#29332D] dark:bg-[#111614]/70 dark:text-[#B9C9BC]">
          <Users className="h-3.5 w-3.5 text-[#1C442D] dark:text-[#D5B16D]" aria-hidden="true" />
          Read together
        </span>
      </div>
    </div>
  );
};
