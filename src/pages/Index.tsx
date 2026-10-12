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

        {/* 6. Atmospheric Final Call-to-Action with warm library aesthetic (matching Image 2 reference) */}
        <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B0D0C] via-[#121413] to-[#0B0D0C] text-[#F3F0E7] overflow-hidden border-t border-[#26302A]">
          {/* Subtle warm library ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(213,177,109,0.06),transparent_65%)] pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center">
            {/* Cultural Origin Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141816] border border-[#26302A] text-xs font-medium text-[#D5B16D] mb-4">
              <span>सहाध्यायी · Fellow Reader</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight mb-4 text-[#F3F0E7]">
              Ready to join Sahadhyayi?
            </h2>
            <p className="text-sm sm:text-base text-[#A5ADA6] mb-8 max-w-xl mx-auto leading-relaxed">
              Explore the library, join reading groups, and be part of a community that reads, thinks, and grows together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              <Link
                to={user ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#D5B16D] hover:bg-[#e4c688] text-black font-semibold text-sm sm:text-base shadow-md shadow-[#D5B16D]/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
              >
                <span>{user ? 'Open Dashboard' : 'Get started'}</span>
                <ArrowRight className="w-4 h-4 text-black/80" />
              </Link>
              <Link
                to="/library"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-[#26302A] hover:border-[#38483D] bg-[#111413] hover:bg-[#181C1A] text-[#F3F0E7] text-sm sm:text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
              >
                <span>Explore the library</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
