import React, { lazy } from 'react';
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import SEO from "@/components/SEO";
import DeferredSection from "@/components/DeferredSection";
import AnimatedHero from "@/components/AnimatedHero";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const SahadhyayiCapabilities = lazy(() => import("@/components/SahadhyayiCapabilities"));
const CurrentReads = lazy(() => import("@/components/library/CurrentReads"));
const HomeBookDiscovery = lazy(() => import("@/components/home/HomeBookDiscovery"));
const HomeCommunityPreview = lazy(() => import("@/components/home/HomeCommunityPreview"));
const HomeEditorialPreview = lazy(() => import("@/components/home/HomeEditorialPreview"));

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
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'fellow reader', 'digital reading community', 'book library', 'reading platform', 'book lovers']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* 1. Animated Hero */}
      <AnimatedHero />

      <div className="sahadhyayi-home-sections bg-[#FAFAF8] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300">
        {/* 2. Logged-in: Continue Reading first */}
        {user && (
          <section className="relative isolate overflow-hidden py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#FAFAF8] dark:bg-[#0B0D0C]">
            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7]">
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
                  <span>View all</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <DeferredSection
                fallback={<div className="min-h-[220px] rounded-2xl border border-[#DDE7D8] dark:border-[#29332D] bg-white dark:bg-[#111614]" aria-hidden="true" />}
                minHeightClassName="min-h-[220px]"
              >
                <ErrorBoundary fallback={<div className="min-h-[140px] rounded-2xl border border-[#DDE7D8] dark:border-[#29332D] bg-white dark:bg-[#111614] p-6 text-center text-sm text-[#636B65] dark:text-[#A5ADA6]">Your reading progress could not be loaded right now.</div>}>
                  <CurrentReads />
                </ErrorBoundary>
              </DeferredSection>
            </div>
          </section>
        )}

        {/* 3. Real Book Discovery */}
        <DeferredSection
          fallback={<div className="min-h-[640px] sm:min-h-[680px] lg:min-h-[720px] bg-[#FAFAF8] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[640px] sm:min-h-[680px] lg:min-h-[720px]"
        >
          <ErrorBoundary fallback={null}>
            <HomeBookDiscovery />
          </ErrorBoundary>
        </DeferredSection>

        {/* 4. Real Community Preview */}
        <DeferredSection
          fallback={<div className="min-h-[1320px] sm:min-h-[1080px] lg:min-h-[820px] bg-[#FAFAF8] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[1320px] sm:min-h-[1080px] lg:min-h-[820px]"
        >
          <ErrorBoundary fallback={null}>
            <HomeCommunityPreview />
          </ErrorBoundary>
        </DeferredSection>

        {/* 5. Explore the Platform / Capabilities */}
        <DeferredSection
          fallback={<div className="min-h-[760px] sm:min-h-[650px] lg:min-h-[500px] bg-[#FAFAF8] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[760px] sm:min-h-[650px] lg:min-h-[500px]"
        >
          <ErrorBoundary fallback={null}>
            <SahadhyayiCapabilities />
          </ErrorBoundary>
        </DeferredSection>

        {/* 6. Editorial blogs and community articles are distinct content destinations. */}
        <DeferredSection
          fallback={<div className="min-h-[640px] sm:min-h-[560px] lg:min-h-[520px] bg-[#FAFAF8] dark:bg-[#0B0D0C]" aria-hidden="true" />}
          minHeightClassName="min-h-[640px] sm:min-h-[560px] lg:min-h-[520px]"
        >
          <HomeEditorialPreview />
        </DeferredSection>

        {/* 7. Atmospheric Final Call-to-Action with warm library aesthetic */}
        <section className="home-final-cta relative isolate py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAF8] dark:bg-gradient-to-br dark:from-[#0B0D0C] dark:via-[#121413] dark:to-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] overflow-hidden transition-colors duration-300">

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Cultural Origin Tag */}
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#8F681C] dark:text-[#D5B16D] mb-4">
              सहाध्यायी · Fellow Reader
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-5 text-[#1C201D] dark:text-[#F3F0E7]">
              Ready to join Sahadhyayi?
            </h2>
            <p className="text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] mb-9 max-w-2xl mx-auto leading-relaxed">
              Explore the library, join reading groups, and be part of a community that reads, thinks, and grows together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              <Link
                to={user ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#8F681C] hover:bg-[#785715] text-white dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] dark:text-stone-950 font-semibold text-sm sm:text-base shadow-md shadow-[#8F681C]/20 dark:shadow-[#D5B16D]/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
              >
                <span>{user ? 'Open Dashboard' : 'Get started'}</span>
                <ArrowRight className="w-4 h-4 text-white/90 dark:text-stone-950/80" />
              </Link>
              <Link
                to="/library"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-[#DDE5D8] hover:border-[#B7CEB7] bg-white/85 hover:bg-[#ECF4EA] text-[#1C201D] dark:border-[#26302A] dark:hover:border-[#38483D] dark:bg-[#111413] dark:hover:bg-[#181C1A] dark:text-[#F3F0E7] text-sm sm:text-base font-medium transition-all shadow-2xs dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D]"
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
