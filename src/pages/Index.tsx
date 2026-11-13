import React, { lazy } from 'react';
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import SEO from "@/components/SEO";
import DeferredSection from "@/components/DeferredSection";
import AnimatedHero from "@/components/AnimatedHero";
import HomeReadingPeopleSection from "@/components/home/HomeReadingPeopleSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Section 01: Animated Hero (LOCKED - imported directly)
// Logged-in Continue Reading
const CurrentReads = lazy(() => import("@/components/library/CurrentReads"));

// Section 02: Sliding Books / Discovery (LOCKED)
const HomeBookDiscovery = lazy(() => import("@/components/home/HomeBookDiscovery"));

// Section 03: The Sahadhyayi Bicycle Adventure Journey (Immersive 2.5D Journey through 8 Destinations)
const SahadhyayiJourney = lazy(() =>
  import("@/components/home/journey/SahadhyayiJourney").then((m) => ({ default: m.SahadhyayiJourney }))
);

// NEW Section 04: Reading Universe feature discovery
const HomeFeatureUniverse = lazy(() => import("@/components/home/HomeFeatureUniverse"));

// Existing final join section
const HomeFinalCtaSection = lazy(() => import("@/components/home/HomeFinalCtaSection"));

const Index = () => {
  const { user } = useAuth();

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

  return (
    <>
      <SEO
        title="Sahadhyayi - Digital Reading Community & Book Library"
        description="Sahadhyayi means 'fellow reader' in Sanskrit. Join our reading community, discover books, and connect with fellow readers worldwide."
        canonical="https://sahadhyayi.com/"
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'fellow reader', 'digital reading community', 'book library', 'reading platform', 'book lovers']}
        schema={structuredData}
      />

      {/* 01. Existing Animated Hero (LOCKED) */}
      <ErrorBoundary fallback={null}>
        <AnimatedHero />
      </ErrorBoundary>

      <div className="sahadhyayi-home-sections bg-[#FAF9F5] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300">
        {/* Logged-in reader: Continue reading */}
        {user?.id && (
          <section className="relative isolate overflow-hidden py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5] dark:bg-[#0B0D0C] border-b border-[#EBE6DC]/80 dark:border-[#1E2520]">
            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-2.5">
                    <span aria-hidden="true" className="h-px w-6 bg-[#8F681C] dark:bg-[#D5B16D]" />
                    <span>Your Reading Life</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
                    Continue reading
                  </h2>
                  <p className="text-[#636B65] dark:text-[#A5ADA6] text-sm mt-1">
                    Pick up where you left off and keep your reading journey going.
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start sm:self-end group"
                >
                  <span>View all shelf</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <DeferredSection
                fallback={<div className="min-h-[220px] rounded-2xl border border-[#E5E0D8] dark:border-[#242E28] bg-white dark:bg-[#131715]" aria-hidden="true" />}
                minHeightClassName="min-h-[220px]"
              >
                <ErrorBoundary fallback={<div className="min-h-[140px] rounded-2xl border border-[#E5E0D8] dark:border-[#242E28] bg-white dark:bg-[#131715] p-6 text-center text-sm text-[#636B65] dark:text-[#A5ADA6]">Your reading progress could not be loaded right now.</div>}>
                  <CurrentReads />
                </ErrorBoundary>
              </DeferredSection>
            </div>
          </section>
        )}

        {/* 02. Existing Sliding Books & Discovery (LOCKED) */}
        <DeferredSection
          fallback={<div className="min-h-[640px] sm:min-h-[680px] lg:min-h-[720px] bg-[#FAF9F5] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[640px] sm:min-h-[680px] lg:min-h-[720px]"
        >
          <ErrorBoundary fallback={null}>
            <HomeBookDiscovery />
          </ErrorBoundary>
        </DeferredSection>

        {/* Reader Map is Sahadhyayi’s signature connection feature: surface it immediately after discovery. */}
        <DeferredSection fallback={<div className="min-h-[700px] bg-[#F5F3EC] dark:bg-[#0B0D0C]" aria-hidden="true" />} minHeightClassName="min-h-[700px]">
          <ErrorBoundary fallback={null}><HomeReadingPeopleSection /></ErrorBoundary>
        </DeferredSection>


        {/* 03. The Sahadhyayi Bicycle Adventure Journey (LOCKED) */}
        <DeferredSection
          fallback={<div className="min-h-[800px] bg-background" aria-hidden="true" />}
          minHeightClassName="min-h-[800px]"
        >
          <ErrorBoundary fallback={null}>
            <SahadhyayiJourney />
          </ErrorBoundary>
        </DeferredSection>

        {/* 04. NEW Reading Universe — all major features, with mood discovery */}
        <DeferredSection
          fallback={<div className="min-h-[1100px] bg-[#FAF9F5] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[1100px]"
        >
          <ErrorBoundary fallback={<div className="px-6 py-12 text-center text-sm text-muted-foreground">Explore all the ways to read, connect and create on Sahadhyayi.</div>}>
            <HomeFeatureUniverse />
          </ErrorBoundary>
        </DeferredSection>

        {/* 05. Existing Final Join Sahadhyayi */}
        <DeferredSection
          fallback={<div className="min-h-[380px] bg-[#F5F3EC] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[380px]"
        >
          <ErrorBoundary fallback={null}>
            <HomeFinalCtaSection />
          </ErrorBoundary>
        </DeferredSection>
      </div>
    </>
  );
};

export default Index;
