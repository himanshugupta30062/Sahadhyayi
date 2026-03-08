
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, PenTool, Gamepad2, Newspaper, ArrowRight, UserPlus, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";
import AnimatedHero from "@/components/AnimatedHero";
import CurrentReads from "@/components/library/CurrentReads";
import ContactFormDialog from "@/components/ContactFormDialog";

const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sahadhyayi",
    "alternateName": ["Sahadhyayi Reading Community", "Fellow Reader Platform"],
    "url": "https://sahadhyayi.com",
    "description": "Digital reading community connecting readers and authors worldwide.",
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
    }
  };

  const newFeatures = [
    { icon: PenTool, title: "Publish & Blog", description: "Write articles and share book reviews with the community.", to: "/blog", iconColor: "text-purple-400", cta: "Start Writing" },
    { icon: Gamepad2, title: "Book Quizzes", description: "Test your knowledge, earn badges, and compete on leaderboards.", to: "/games", iconColor: "text-amber-400", cta: "Play Now" },
    { icon: Newspaper, title: "Articles & Insights", description: "Discover curated articles, reading tips, and literary analysis.", to: "/articles", iconColor: "text-emerald-400", cta: "Browse Articles" },
  ];

  const quickLinks = [
    { to: "/library", icon: BookOpen, label: "Library" },
    { to: "/groups", icon: Users, label: "Groups" },
    { to: "/map", icon: Map, label: "Reader Map" },
    { to: "/authors", icon: Calendar, label: "Authors" },
  ];

  return (
    <>
      <SEO
        title="Sahadhyayi - Digital Reading Community & Book Library"
        description="Join Sahadhyayi, a vibrant digital reading community. Discover books, connect with fellow readers, track progress, and explore our digital library."
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'digital reading community', 'book library', 'reading platform', 'book lovers']}
      />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <AnimatedHero />

      <div className="bg-black text-white">

        {/* ─── Logged-in: Current Reads (shown early) ─── */}
        {user && (
          <section className="py-10 sm:py-14 px-4 border-b border-orange-900/30">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
                    Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader'}!
                  </h2>
                  <p className="text-gray-400 mt-1">Continue your reading journey</p>
                </div>
                <Link to="/dashboard">
                  <Button variant="outline" className="border-orange-700 text-orange-400 hover:bg-orange-900/30">
                    Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CurrentReads />
            </div>
          </section>
        )}

        {/* ─── What's New ─── */}
        <section className="py-12 sm:py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(234,88,12,0.08),transparent_60%)]" />
          <div className="max-w-6xl mx-auto relative">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400 bg-orange-900/40 px-3 py-1.5 rounded-full mb-4">
                <Star className="w-3.5 h-3.5" /> What's New
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 mb-3">More Than Just Reading</h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">Write, play, discover, and connect — your complete literary world.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {newFeatures.map(f => {
                const Icon = f.icon;
                return (
                  <Link key={f.title} to={f.to} className="group block">
                    <Card className="h-full border border-orange-700/50 hover:border-orange-500 transition-all duration-300 hover:-translate-y-1.5 bg-zinc-900 hover:bg-zinc-800/90">
                      <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${f.iconColor} bg-zinc-800 border border-orange-700/30 transition-transform group-hover:scale-110`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                        <p className="text-sm text-gray-300 leading-relaxed mb-5 flex-1">{f.description}</p>
                        <span className="text-sm font-semibold text-orange-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                          {f.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Quick Navigation Strip (replaces 4-card "Explore Platform" grid) ─── */}
        <section className="py-8 px-4 border-t border-b border-orange-900/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {quickLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.to} to={link.to}>
                    <Button variant="outline" className="border-orange-800/40 text-gray-300 hover:bg-orange-900/30 hover:text-orange-300 hover:border-orange-600 gap-2 px-5 py-2.5">
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Condensed About Section (merged from 3 redundant sections) ─── */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4">What is Sahadhyayi?</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-orange-400">Sahadhyayi</strong> (सहाध्यायी) means "fellow reader" in Sanskrit — from <em>saha</em> (together) and <em>adhyayi</em> (one who reads). We're building a digital home where readers connect, share insights, and grow together.
                </p>
                <p className="text-gray-400 leading-relaxed mb-6">
                  In a world shifting toward passive content, we help you rediscover deep, focused reading through community support, collaborative learning, and modern tools.
                </p>
                <Link to="/about" className="text-orange-400 hover:text-orange-300 font-medium text-sm inline-flex items-center gap-1">
                  Learn more about our mission <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="bg-zinc-900/80 p-6 rounded-2xl border border-orange-800/30">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Why readers choose us</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  {[
                    { emoji: '🌎', text: 'Global community of passionate readers' },
                    { emoji: '📚', text: 'Deep reading tools for focused comprehension' },
                    { emoji: '🤝', text: 'Collaborative learning through shared insights' },
                    { emoji: '🕯️', text: 'Ancient wisdom meets modern technology' },
                    { emoji: '💬', text: 'Lasting connections through shared reading' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{item.emoji}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA (only for logged-out users) ─── */}
        {!user && (
          <section className="py-12 sm:py-16 px-4 border-t border-orange-900/20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Reading?</h2>
              <p className="text-gray-400 mb-8 text-lg">Join thousands of readers building better reading habits together.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="px-8">
                    <UserPlus className="w-5 h-5 mr-2" /> Get Started Free
                  </Button>
                </Link>
                <Link to="/library">
                  <Button size="lg" variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-8">
                    Browse Library
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
      <ContactFormDialog />
    </>
  );
};

export default Index;
