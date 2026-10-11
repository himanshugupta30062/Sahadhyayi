import React, { lazy } from 'react';
import { Button } from "@/components/ui/button";
import { BookOpen, UserPlus, ArrowRight, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";
import DeferredSection from "@/components/DeferredSection";
import AnimatedHero from "@/components/AnimatedHero";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const SahadhyayiCapabilities = lazy(() => import("@/components/SahadhyayiCapabilities"));
const CurrentReads = lazy(() => import("@/components/library/CurrentReads"));
const HomeBookDiscovery = lazy(() => import("@/components/home/HomeBookDiscovery"));
const HomeCommunityPreview = lazy(() => import("@/components/home/HomeCommunityPreview"));

const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sahadhyayi",
    "alternateName": ["Sahadhyayi Reading Community", "Sahadhyayi Digital Library", "Fellow Reader Platform"],
    "url": "https://sahadhyayi.com",
    "description": "Sahadhyayi means 'fellow reader' in Sanskrit. Join our digital reading community platform connecting readers and authors worldwide for deep reading experiences.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sahadhyayi.com/library?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sahadhyayi",
      "url": "https://sahadhyayi.com",
      "logo": "https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png",
      "foundingDate": "2024"
    }
  };

  const primaryCta = user
    ? { to: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard }
    : { to: "/signup", label: "Get Started Free", icon: UserPlus };

  const PrimaryCtaIcon = primaryCta.icon;
  const firstName =
    (typeof profile?.full_name === 'string' && profile.full_name.trim().split(/\s+/)[0]) ||
    (typeof user?.email === 'string' && user.email.split('@')[0]) ||
    'Reader';

  return (
    <>
      <SEO
        title="Sahadhyayi - Digital Reading Community & Book Library"
        description="Sahadhyayi means 'fellow reader' in Sanskrit. Join our reading community, discover books, and connect with fellow readers worldwide."
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'fellow reader', 'digital reading community', 'book library', 'reading platform', 'book lovers']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* 1. Animated Hero */}
      <AnimatedHero />

      <div className="bg-[#0B0D0C] text-[#F3F0E7]">
        {/* 2. Logged-in: Continue Reading first */}
        {user && (
          <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-[#29332D]">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F3F0E7]">
                    Continue reading
                  </h2>
                  <p className="text-[#A5ADA6] text-sm mt-1">
                    Pick up where you left off and keep your reading journey going.
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors self-start sm:self-end group"
                >
                  <span>View all</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <DeferredSection
                fallback={<div className="min-h-[220px] rounded-2xl border border-[#29332D] bg-[#111614]" aria-hidden="true" />}
                minHeightClassName="min-h-[220px]"
              >
                <ErrorBoundary fallback={<div className="min-h-[140px] rounded-2xl border border-[#29332D] bg-[#111614] p-6 text-center text-sm text-[#A5ADA6]">Your reading progress could not be loaded right now.</div>}>
                  <CurrentReads />
                </ErrorBoundary>
              </DeferredSection>
            </div>
          </section>
        )}

        {/* 3. Real Book Discovery */}
        <DeferredSection
          fallback={<div className="min-h-[360px] bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[360px]"
        >
          <ErrorBoundary fallback={null}>
            <HomeBookDiscovery />
          </ErrorBoundary>
        </DeferredSection>

        {/* 4. Real Community Preview */}
        <DeferredSection
          fallback={<div className="min-h-[400px] bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[400px]"
        >
          <ErrorBoundary fallback={null}>
            <HomeCommunityPreview />
          </ErrorBoundary>
        </DeferredSection>

        {/* 5. Explore the Platform / Capabilities */}
        <DeferredSection
          fallback={<div className="min-h-[320px] bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[320px]"
        >
          <ErrorBoundary fallback={null}>
            <SahadhyayiCapabilities />
          </ErrorBoundary>
        </DeferredSection>

        {/* Guest Cultural Origin & Mission callout */}
        {!user && (
          <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] border-b border-[#29332D]">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#D5B16D] mb-3 block">
                The Origin
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#F3F0E7] mb-4">
                What "Sahadhyayi" Means
              </h2>
              <p className="text-sm sm:text-base text-[#A5ADA6] leading-relaxed max-w-2xl mx-auto">
                <strong className="text-[#F3F0E7]">Sahadhyayi</strong> (सहाध्यायी) is Sanskrit for <em className="text-[#D5B16D]">"fellow reader"</em> — from <em className="text-[#D5B16D]">saha</em> (together) and <em className="text-[#D5B16D]">adhyayi</em> (one who studies). We build a digital home for readers to connect, share insights, and support each other's reading journey.
              </p>
              <div className="mt-6">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D5B16D] hover:text-[#e4c688] transition-colors group"
                >
                  <span>Read our complete story</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 6. Atmospheric Final Call-to-Action (Image 2 reference) */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B0D0C] via-[#121614] to-[#0B0D0C] text-[#F3F0E7] overflow-hidden border-t border-[#29332D]">
          {/* Subtle warm library glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(213,177,109,0.08),transparent_65%)] pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight mb-4 text-[#F3F0E7]">
              Your next great read (and conversation) is here.
            </h2>
            <p className="text-sm sm:text-base text-[#A5ADA6] mb-8 max-w-xl mx-auto leading-relaxed">
              Explore a growing library, join a vibrant community, and make reading a more meaningful experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              <Link
                to={user ? "/dashboard" : "/library"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#D5B16D] hover:bg-[#e4c688] text-black font-semibold text-sm sm:text-base shadow-md shadow-[#D5B16D]/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
              >
                <span>{user ? 'Open Dashboard' : 'Explore the library'}</span>
                <ArrowRight className="w-4 h-4 text-black/80" />
              </Link>
              <Link
                to={user ? "/library" : "/signup"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-[#29332D] hover:border-[#415147] bg-[#111614] hover:bg-[#1B241E] text-[#F3F0E7] text-sm sm:text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
              >
                <span>{user ? 'Browse the library' : 'Create your account'}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
