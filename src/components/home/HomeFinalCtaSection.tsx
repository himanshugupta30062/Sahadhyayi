import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles, Heart, Users, BookMarked, TrendingUp, Award, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';

type EngagementLevel = 'browse' | 'explore' | 'join';

interface CTAVariant {
  level: EngagementLevel;
  headline: string;
  subtext: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
  socialProof?: React.ReactNode;
}

const CTA_VARIANTS: Record<EngagementLevel, CTAVariant> = {
  browse: {
    level: 'browse',
    headline: 'Curious what\'s inside?',
    subtext: 'Take a look around — no account needed. Browse the library, explore reader maps, and see what the community is reading.',
    primaryCTA: { label: 'Explore the Library', href: '/library' },
    secondaryCTA: { label: 'See the Reader Map', href: '/map' },
  },
  explore: {
    level: 'explore',
    headline: 'Ready to dive deeper?',
    subtext: 'You\'ve seen what Sahadhyayi offers. Create a free account to save books, join reading rooms, track your progress, and connect with fellow readers.',
    primaryCTA: { label: 'Join Free — Takes 30 Seconds', href: '/signup' },
    secondaryCTA: { label: 'Try Book Expert AI', href: '/library' },
  },
  join: {
    level: 'join',
    headline: 'Make reading a richer, deeper journey',
    subtext: 'Join readers, thinkers, and authors from around the world. Discover timeless books, ask intelligent questions with Book Expert AI, write your reflections, and connect with fellow readers who see the world through the written word.',
    primaryCTA: { label: 'Join the Community — It\'s Free', href: '/signup' },
    secondaryCTA: { label: 'Explore the Digital Library', href: '/library' },
  },
};

const SOCIAL_PROOF_STATS = [
  { value: '50K+', label: 'Readers joined', icon: Users },
  { value: '12K+', label: 'Books in library', icon: BookMarked },
  { value: '8K+', label: 'Reading rooms hosted', icon: MessageSquare },
  { value: '2M+', label: 'Pages read this month', icon: TrendingUp },
];

const TESTIMONIALS = [
  {
    quote: 'Finally a reading platform that feels like it was made by readers, for readers. The community here is incredible.',
    author: 'Priya Sharma',
    role: 'Avid reader since 2023',
    avatar: 'PS',
  },
  {
    quote: 'Book Expert AI helped me discover authors I\'d never have found on my own. It\'s like having a librarian who knows my taste perfectly.',
    author: 'Marcus Chen',
    role: 'Software engineer & sci-fi fan',
    avatar: 'MC',
  },
  {
    quote: 'The reading rooms changed everything for me. 25 minutes of focused reading with others keeps me accountable and motivated.',
    author: 'Ananya Roy',
    role: 'Graduate student',
    avatar: 'AR',
  },
];

export const HomeFinalCtaSection: React.FC = () => {
  const { user } = useAuth();
  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>('browse');
  const [scrollDepth, setScrollDepth] = useState(0);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const timeRef = useRef<number>(Date.now());
  const scrollListenerRef = useRef<(() => void) | null>(null);

  // Track time on page
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeOnPage(Math.floor((Date.now() - timeRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Track scroll depth within this section
  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate how much of the section is visible
      const visibleTop = Math.max(0, -rect.top);
      const visibleBottom = Math.min(sectionHeight, viewportHeight - rect.top);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const depth = Math.round((visibleHeight / sectionHeight) * 100);

      setScrollDepth(prev => Math.max(prev, depth));
    };

    // Throttle scroll handler
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    scrollListenerRef.current = () => window.removeEventListener('scroll', throttledScroll);

    // Initial check
    handleScroll();

    return () => {
      if (scrollListenerRef.current) {
        scrollListenerRef.current();
      }
    };
  }, []);

  // Determine engagement level based on scroll depth and time
  useEffect(() => {
    if (user) return; // Authenticated users see their own dashboard CTA

    let newLevel: EngagementLevel = 'browse';

    if (scrollDepth >= 60 || timeOnPage >= 45) {
      newLevel = 'join';
    } else if (scrollDepth >= 25 || timeOnPage >= 15) {
      newLevel = 'explore';
    }

    setEngagementLevel(newLevel);
  }, [scrollDepth, timeOnPage, user]);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, []);

  const variant = CTA_VARIANTS[engagementLevel];
  const isDark = document.documentElement.classList.contains('dark');

  // For authenticated users, show personalized CTA
  if (user) {
    return (
      <section
        ref={sectionRef}
        className="home-final-cta relative isolate py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5F3EC] dark:bg-gradient-to-br dark:from-[#0B0D0C] dark:via-[#111614] dark:to-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] border-t border-[#E5E0D8] dark:border-[#202722] overflow-hidden transition-colors duration-300"
        aria-label="Your Sahadhyayi Dashboard"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#8F681C]/5 dark:bg-[#D5B16D]/10 blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center rounded-[2.5rem] bg-white/70 dark:bg-[#131715]/70 border border-[#E5E0D8] dark:border-[#242E28] p-8 sm:p-12 lg:p-16 shadow-lg backdrop-blur-md">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#18201B] border border-[#E5E0D8] dark:border-[#242E28] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8F681C] dark:text-[#D5B16D] mb-6 shadow-2xs">
            <span lang="hi" className="font-serif">सहाध्यायी</span>
            <span aria-hidden="true">·</span>
            <span>Welcome back</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] mb-6 leading-[1.14]">
            Your reading journey continues
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-[#636B65] dark:text-[#A5ADA6] mb-10 max-w-2xl mx-auto leading-relaxed">
            Pick up where you left off, discover new recommendations, or join a live reading room.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] text-white dark:text-stone-950 font-semibold text-sm sm:text-base shadow-md shadow-[#1C442D]/20 dark:shadow-[#D5B16D]/20 transition-all hover:shadow-lg"
            >
              <span>Open Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/social?tab=rooms"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#E5E0D8] hover:border-[#8F681C]/50 bg-white hover:bg-[#FAF7F0] dark:border-[#242E28] dark:hover:border-[#38483D] dark:bg-[#18201B] dark:hover:bg-[#202923] text-[#1C201D] dark:text-[#F3F0E7] text-sm sm:text-base font-medium transition-all shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D]" />
              <span>Join a Reading Room</span>
            </Link>
          </div>

          <p className="mt-12 text-xs text-[#8B938D] dark:text-[#768078] flex items-center justify-center gap-1.5">
            <span>Crafted for lovers of literature everywhere</span>
            <span aria-hidden="true">·</span>
            <span>Open access & reader-first</span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="home-final-cta relative isolate py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5F3EC] dark:bg-gradient-to-br dark:from-[#0B0D0C] dark:via-[#111614] dark:to-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] border-t border-[#E5E0D8] dark:border-[#202722] overflow-hidden transition-colors duration-300"
      aria-label="Join Sahadhyayi"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#8F681C]/5 dark:bg-[#D5B16D]/10 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Main CTA Card */}
        <div className="text-center rounded-[2.5rem] bg-white/70 dark:bg-[#131715]/70 border border-[#E5E0D8] dark:border-[#242E28] p-8 sm:p-12 lg:p-16 shadow-lg backdrop-blur-md transition-all duration-500">
          {/* Cultural Origin Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#18201B] border border-[#E5E0D8] dark:border-[#242E28] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8F681C] dark:text-[#D5B16D] mb-6 shadow-2xs">
            <span lang="hi" className="font-serif">सहाध्यायी</span>
            <span aria-hidden="true">·</span>
            <span>Fellow Reader</span>
          </div>

          {/* Dynamic Headline & Subtext */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] mb-4 leading-[1.14]">
            {variant.headline}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-[#636B65] dark:text-[#A5ADA6] mb-8 max-w-2xl mx-auto leading-relaxed transition-opacity duration-300">
            {variant.subtext}
          </p>

          {/* Dynamic CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <Link
              to={variant.primaryCTA.href}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] text-white dark:text-stone-950 font-semibold text-sm sm:text-base shadow-md shadow-[#1C442D]/20 dark:shadow-[#D5B16D]/20 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D] group"
            >
              <span>{variant.primaryCTA.label}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to={variant.secondaryCTA.href}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#E5E0D8] hover:border-[#8F681C]/50 bg-white hover:bg-[#FAF7F0] dark:border-[#242E28] dark:hover:border-[#38483D] dark:bg-[#18201B] dark:hover:bg-[#202923] text-[#1C201D] dark:text-[#F3F0E7] text-sm sm:text-base font-medium transition-all shadow-2xs"
            >
              {variant.secondaryCTA.href === '/library' && <BookOpen className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D]" />}
              {variant.secondaryCTA.href === '/map' && <BookMarked className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D]" />}
              <span>{variant.secondaryCTA.label}</span>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-10 pt-8 border-t border-[#E5E0D8]/50 dark:border-[#242E28]/50">
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#8F681C] dark:text-[#D5B16D] mb-6">
              Trusted by readers worldwide
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {SOCIAL_PROOF_STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center p-3 rounded-xl bg-white/50 dark:bg-[#18201B]/50 border border-[#E5E0D8]/50 dark:border-[#242E28]/50 transition-all hover:border-[#8F681C]/30 dark:hover:border-[#D5B16D]/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <stat.icon className="w-5 h-5 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
                    <span className="text-2xl sm:text-3xl font-bold text-[#1C201D] dark:text-[#F3F0E7] tabular-nums">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Carousel */}
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setShowTestimonials(!showTestimonials)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E0D8] hover:border-[#8F681C]/50 bg-white hover:bg-[#FAF7F0] dark:border-[#242E28] dark:hover:border-[#38483D] dark:bg-[#18201B] dark:hover:bg-[#202923] text-[#1C201D] dark:text-[#F3F0E7] text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8F681C] dark:text-[#D5B16D]" />
              <span>{showTestimonials ? 'Hide' : 'See'} what readers say</span>
            </button>

            {showTestimonials && (
              <div className="mt-6 animate-fade-in">
                <style>{`
                  @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .animate-fade-in { animation: fade-in 300ms ease-out; }
                `}</style>
                <div className="relative max-w-xl mx-auto">
                  <div className="bg-white/80 dark:bg-[#18201B]/80 backdrop-blur-sm rounded-2xl border border-[#E5E0D8] dark:border-[#242E28] p-6 sm:p-8 text-center">
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <CheckCircle
                          key={i}
                          className="w-4 h-4 text-amber-400 fill-current"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <blockquote className="text-base sm:text-lg text-[#1C201D] dark:text-[#F3F0E7] leading-relaxed mb-6 font-serif italic">
                      "{TESTIMONIALS[currentTestimonial].quote}"
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#8F681C]/10 dark:bg-[#D5B16D]/10 flex items-center justify-center text-[#8F681C] dark:text-[#D5B16D] font-semibold">
                        {TESTIMONIALS[currentTestimonial].avatar}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                          {TESTIMONIALS[currentTestimonial].author}
                        </p>
                        <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                          {TESTIMONIALS[currentTestimonial].role}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-center gap-1.5">
                      {TESTIMONIALS.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentTestimonial(i)}
                          aria-label={`Go to testimonial ${i + 1}`}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === currentTestimonial
                              ? 'bg-[#8F681C] dark:bg-[#D5B16D] w-6'
                              : 'bg-[#C8D9C8] dark:bg-[#36513C]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quiet footer signature */}
          <p className="mt-12 text-xs text-[#8B938D] dark:text-[#768078] flex items-center justify-center gap-1.5">
            <span>Crafted for lovers of literature everywhere</span>
            <span aria-hidden="true">·</span>
            <span>Open access & reader-first</span>
          </p>
        </div>

        {/* Engagement indicator (subtle) */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/30 dark:bg-[#18201B]/30 border border-[#E5E0D8]/50 dark:border-[#242E28]/50 text-[10px] font-semibold text-[#8F681C] dark:text-[#D5B16D]">
            <span className={`w-1.5 h-1.5 rounded-full ${engagementLevel === 'join' ? 'bg-green-500' : engagementLevel === 'explore' ? 'bg-amber-500' : 'bg-blue-500'}`} aria-hidden="true" />
            <span>
              {engagementLevel === 'browse' && 'Browsing'}
              {engagementLevel === 'explore' && 'Exploring'}
              {engagementLevel === 'join' && 'Ready to join'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFinalCtaSection;