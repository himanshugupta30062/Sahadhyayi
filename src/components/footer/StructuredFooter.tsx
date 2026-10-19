import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Sparkles,
  Twitter,
} from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';

const footerSections = [
  {
    title: 'Explore',
    links: [
      { name: 'Digital Library', href: '/library' },
      { name: 'Discover Books', href: '/discovery' },
      { name: 'Authors', href: '/authors' },
      { name: 'Articles & Stories', href: '/articles' },
      { name: 'Reader Map', href: '/map' },
    ],
  },
  {
    title: 'Community',
    links: [
      { name: 'Reading Feed', href: '/social' },
      { name: 'Reading Groups', href: '/groups' },
      { name: 'Live Reading Rooms', href: '/social?tab=rooms' },
      { name: 'Community Guidelines', href: '/community-guidelines' },
    ],
  },
  {
    title: 'Support & About',
    links: [
      { name: 'About Sahadhyayi', href: '/about' },
      { name: 'Help Center', href: '/help-center' },
      { name: 'Contact & Feedback', href: '/feedback' },
    ],
  },
  {
    title: 'Legal & Policies',
    links: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
    ],
  },
];

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61578920175928', icon: Facebook },
  { name: 'X', href: 'https://x.com/Sahadhyayi', icon: Twitter },
  { name: 'Instagram', href: 'https://www.instagram.com/sahadhyayi/', icon: Instagram },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/sahadhyayi/', icon: Linkedin },
];

const footerLinkClass =
  'group inline-flex max-w-full items-start gap-1.5 text-sm leading-6 text-[#636B65] transition-colors hover:text-[#1C442D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F4EFEA] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]';

const StructuredFooter = () => {
  const { user } = useAuth();
  const [isPulseOpen, setIsPulseOpen] = useState(false);

  useEffect(() => {
    const handleOpenPulse = () => setIsPulseOpen(true);
    window.addEventListener('open-community-pulse', handleOpenPulse);
    return () => window.removeEventListener('open-community-pulse', handleOpenPulse);
  }, []);

  return (
    <footer
      className="relative mt-auto overflow-hidden border-t border-[#E8E2D9] bg-[#F4EFEA] text-[#1C201D] transition-colors duration-200 dark:border-[#29332D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]"
      role="contentinfo"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-[#B68A35]/[0.07] blur-3xl dark:bg-[#D5B16D]/[0.06]" />
        <div className="absolute -left-40 bottom-20 h-80 w-80 rounded-full bg-[#1C442D]/[0.06] blur-3xl dark:bg-[#1C442D]/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* Editorial Community Invitation Card */}
        <section
          aria-labelledby="footer-invitation-title"
          className="relative mb-12 overflow-hidden rounded-[1.75rem] border border-[#DCD5C9] bg-gradient-to-br from-white via-[#FBF8F2] to-[#EBF2EC] p-6 shadow-[0_12px_40px_rgba(28,32,29,0.05)] dark:border-[#29332D] dark:from-[#111614] dark:via-[#111614] dark:to-[#14251B] dark:shadow-none sm:p-8 lg:mb-16 lg:p-10"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 hidden h-56 w-56 rounded-full border border-[#1C442D]/10 dark:border-[#D5B16D]/10 sm:block" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-1 top-0 hidden h-44 w-44 rounded-full border border-[#1C442D]/10 dark:border-[#D5B16D]/10 sm:block" />
          <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8DBCB] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1C442D] dark:border-[#315C43] dark:bg-[#0B0D0C]/60 dark:text-[#D5B16D]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                A community of fellow readers
              </div>
              <h2
                id="footer-invitation-title"
                className="max-w-xl font-serif text-3xl font-bold leading-tight tracking-tight text-[#1C201D] dark:text-[#F3F0E7] sm:text-4xl lg:text-[2.75rem]"
              >
                Every book can start a conversation.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6] sm:text-base">
                Find your next read, exchange ideas, and meet people who see the world through books.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                to="/library"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#143221] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFEA] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#E2C17D] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]"
              >
                Explore the library
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to={user ? '/social' : '/signup'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D5CEC2] bg-white/80 px-5 py-3 text-sm font-semibold text-[#1C201D] transition hover:border-[#1C442D]/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFEA] dark:border-[#34443A] dark:bg-[#111614]/80 dark:text-[#F3F0E7] dark:hover:border-[#D5B16D]/50 dark:hover:bg-[#161D19] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]"
              >
                {user ? 'Open reading feed' : 'Join the community'}
              </Link>
            </div>
          </div>
        </section>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-12 lg:gap-x-6 xl:gap-x-8">
          {/* Brand & Live Stats Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <Link
              to={user ? '/dashboard' : '/'}
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F4EFEA] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]"
              aria-label="Sahadhyayi home"
            >
              <img
                src="/lovable-uploads/logo-small.webp"
                alt=""
                aria-hidden="true"
                width={40}
                height={40}
                loading="lazy"
                className="h-10 w-10 object-contain"
              />
              <span className="font-serif text-2xl font-bold tracking-tight">Sahadhyayi</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">
              Sahadhyayi means “fellow reader” — a place to discover books, share ideas, and make reading a more connected experience.
            </p>

            {/* Live Website Stats Trigger Card */}
            <button
              type="button"
              onClick={() => setIsPulseOpen(true)}
              aria-label="Open Live Website Stats"
              className="group mt-5 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[#DCD5C9] bg-white/70 p-3.5 text-left transition hover:border-[#B68A35]/60 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFEA] dark:border-[#29332D] dark:bg-[#111614] dark:hover:border-[#D5B16D]/50 dark:hover:bg-[#151D18] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8DBCB] bg-[#EBF2EC] text-[#1C442D] dark:border-[#315C43] dark:bg-[#1C3024] dark:text-[#D5B16D]">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                  <span>Live Website Stats</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#636B65] dark:text-[#A5ADA6]">
                  Real-time traffic, visitors & reading activity
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#8B938D] transition group-hover:translate-x-0.5 group-hover:text-[#B68A35] dark:group-hover:text-[#D5B16D]" aria-hidden="true" />
            </button>

            {/* Social Links */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.name}`}
                    title={social.name}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCD5C9] bg-white/70 text-[#636B65] transition hover:-translate-y-0.5 hover:border-[#B68A35]/60 hover:text-[#1C442D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFEA] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#A5ADA6] dark:hover:border-[#D5B16D]/50 dark:hover:text-[#D5B16D] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Section Columns */}
          {footerSections.map((section) => (
            <nav
              key={section.title}
              aria-label={section.title}
              className="col-span-1 min-w-0 lg:col-span-2"
            >
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#1C442D] dark:text-[#D5B16D]">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className={footerLinkClass}>
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-[#DCD5C9] pt-6 dark:border-[#29332D] sm:mt-14">
          <div className="flex flex-col gap-3 text-xs leading-5 text-[#737B75] dark:text-[#89938B] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-x-2">
              <span>© {new Date().getFullYear()} Sahadhyayi. All rights reserved.</span>
              <span aria-hidden="true" className="text-[#B68A35]">•</span>
              <span className="inline-flex items-center gap-1.5">
                Made for readers everywhere
                <Heart className="h-3 w-3 fill-[#B65C53] text-[#B65C53]" aria-hidden="true" />
              </span>
            </p>
            <p className="inline-flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Read deeper. Connect meaningfully.</span>
            </p>
          </div>
        </div>
      </div>

      <CommunityPulseDialog
        open={isPulseOpen}
        onClose={() => setIsPulseOpen(false)}
      />
    </footer>
  );
};

export default StructuredFooter;
