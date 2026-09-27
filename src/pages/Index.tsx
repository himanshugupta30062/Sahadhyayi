
import React, { lazy } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones, UserPlus, PenTool, Gamepad2, Newspaper, ArrowRight, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";
import DeferredSection from "@/components/DeferredSection";
import AnimatedHero from "@/components/AnimatedHero";

const SahadhyayiCapabilities = lazy(() => import("@/components/SahadhyayiCapabilities"));
const SahadhyayiCircuit = lazy(() => import("@/components/SahadhyayiCircuit"));
const CurrentReads = lazy(() => import("@/components/library/CurrentReads"));


const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const features = [
    { icon: BookOpen, title: "Personal Bookshelf", description: "Track and manage your reading journey effortlessly." },
    { icon: Users, title: "Global Reading Groups", description: "Engage in book discussions worldwide." },
    { icon: Map, title: "Find Local Readers", description: "Discover local book lovers through our interactive map." },
    { icon: Calendar, title: "Author Connect", description: "Participate in live sessions with your favorite authors." },
    { icon: Star, title: "Community Reviews", description: "Read authentic book reviews from fellow readers." },
    { icon: Headphones, title: "AI Reading Assistant", description: "Instant definitions and explanations as you read." },
  ];

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

  const newFeatures = [
    { icon: PenTool, title: "Publish & Blog", description: "Write articles, share book reviews, and build your voice.", to: "/blog", iconColor: "text-purple-400", cta: "Start Writing" },
    { icon: Gamepad2, title: "Book Quizzes & Games", description: "Test your knowledge, earn badges, and compete on leaderboards.", to: "/games", iconColor: "text-amber-400", cta: "Play Now" },
    { icon: Newspaper, title: "Articles & Insights", description: "Curated articles, reading tips, and literary analysis.", to: "/articles", iconColor: "text-emerald-400", cta: "Browse Articles" },
  ];

  const exploreLinks = [
    { to: "/library", label: "Digital Library", icon: BookOpen },
    { to: "/groups", label: "Reading Groups", icon: Users },
    { to: "/map", label: "Reader Map", icon: Map },
    { to: "/authors", label: "Meet Authors", icon: Calendar },
  ];

  const primaryCta = user
    ? { to: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard }
    : { to: "/signup", label: "Get Started Free", icon: UserPlus };

  const PrimaryCtaIcon = primaryCta.icon;
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader';

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

      {/* Animated Hero */}
      <AnimatedHero />

      <div className="bg-black text-white">
        {/* Logged-in: Continue Reading first */}
        {user && (
          <section className="py-10 sm:py-14 px-4 border-b border-orange-900/30">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
                    Welcome back, {firstName}
                  </h2>
                  <p className="text-gray-400 mt-1">Pick up where you left off</p>
                </div>
                <Link to="/dashboard">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Open Dashboard
                  </Button>
                </Link>
              </div>
              <DeferredSection
                fallback={<div className="min-h-[220px] rounded-2xl border border-orange-900/20 bg-black/20" aria-hidden="true" />}
                minHeightClassName="min-h-[220px]"
              >
                <CurrentReads />
              </DeferredSection>
            </div>
          </section>
        )}

        {/* Circuit visualization */}
        <DeferredSection fallback={<div className="min-h-[320px] bg-black" aria-hidden="true" />} minHeightClassName="min-h-[320px]">
          <SahadhyayiCircuit />
        </DeferredSection>

        {/* What's New spotlight */}
        <section className="py-12 sm:py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(234,88,12,0.08),transparent_60%)]" />
          <div className="max-w-6xl mx-auto relative">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400 bg-orange-900/40 px-3 py-1.5 rounded-full mb-4">
                <Star className="w-3.5 h-3.5" /> What's New
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 mb-3">
                More Than Just Reading
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                Write, play, discover, and connect — your complete literary world.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {newFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} to={feature.to} className="group block">
                    <Card className="h-full border border-orange-700/50 hover:border-orange-500 transition-all duration-300 hover:-translate-y-1.5 bg-zinc-900 hover:bg-zinc-800/90">
                      <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${feature.iconColor} bg-zinc-800 border border-orange-700/30 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-300 leading-relaxed mb-5 flex-1">{feature.description}</p>
                        <span className="text-sm font-semibold text-orange-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                          {feature.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <DeferredSection fallback={<div className="min-h-[280px] bg-black" aria-hidden="true" />} minHeightClassName="min-h-[280px]">
          <SahadhyayiCapabilities />
        </DeferredSection>

        {/* Guests only: Meaning + Mission combined */}
        {!user && (
          <section className="py-12 sm:py-16 px-4 bg-black/60 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 mb-3">What "Sahadhyayi" Means</h2>
                <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  <strong>Sahadhyayi</strong> (सहाध्यायी) is Sanskrit for "fellow reader" — from <em>saha</em> (together) and <em>adhyayi</em> (one who studies).
                  We build a digital home for readers to connect, share insights, and support each other's journey, blending ancient wisdom with modern tools to revive deep reading.
                  <Link to="/about" className="text-orange-400 hover:text-orange-500 font-medium ml-1">Our mission →</Link>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  { icon: "🌎", title: "Global Community", text: "Readers who share your passion." },
                  { icon: "📚", title: "Deep Reading", text: "Focused, meaningful sessions." },
                  { icon: "🤝", title: "Collaborative", text: "Grow through shared insights." },
                  { icon: "🗣️", title: "Diverse Perspectives", text: "Voices from around the world." },
                  { icon: "💬", title: "Lasting Connections", text: "Friendships built through books." },
                  { icon: "🕯️", title: "Tradition + Tech", text: "Ancient ideals, modern delivery." },
                ].map((item) => (
                  <div key={item.title} className="bg-zinc-900/60 border border-orange-700/30 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-100 text-sm">{item.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features grid (compact) */}
        <section className="py-12 sm:py-16 px-4 bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 mb-3">Powerful Tools for Readers</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Read better, understand deeper, and connect meaningfully.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-zinc-900/80 backdrop-blur-sm border-orange-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 bg-orange-900/60 rounded-lg flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-orange-400" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-gray-100">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compact explore link strip */}
        <section className="py-10 px-4 bg-black border-t border-orange-900/30">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Explore the Platform</h2>
              <Link to="/about" className="text-sm text-orange-400 hover:text-orange-500 font-medium inline-flex items-center gap-1">
                About us <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {exploreLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 rounded-xl border border-orange-900/40 bg-zinc-900/60 hover:bg-zinc-800 hover:border-orange-600 px-4 py-3 transition-all"
                >
                  <Icon className="w-5 h-5 text-orange-500 group-hover:text-orange-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-100">{label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16 px-4 bg-black text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              {user ? 'Keep the momentum going' : 'Ready to start your reading journey?'}
            </h2>
            <p className="text-base sm:text-lg mb-8 opacity-90 px-4">
              {user ? 'Jump back into your books or discover something new.' : 'Join today and experience the joy of reading together.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <Link to={primaryCta.to} className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-6 lg:px-8">
                  <PrimaryCtaIcon className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  {primaryCta.label}
                </Button>
              </Link>
              <Link to={user ? "/library" : "/about"} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white font-semibold px-6 lg:px-8">
                  {user ? 'Browse the Library' : 'Learn More'}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
