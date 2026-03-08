import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Users, Map, Star, Headphones, UserPlus,
  PenTool, Gamepad2, Newspaper, ArrowRight, Sparkles, Trophy, Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";
import AnimatedHero from "@/components/AnimatedHero";
import CurrentReads from "@/components/library/CurrentReads";

const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sahadhyayi",
    "alternateName": ["Sahadhyayi Reading Community", "Sahadhyayi Digital Library"],
    "url": "https://sahadhyayi.com",
    "description": "Sahadhyayi means 'fellow reader' in Sanskrit. A digital reading community connecting readers and authors worldwide.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sahadhyayi.com/library?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sahadhyayi",
      "url": "https://sahadhyayi.com",
    }
  };

  return (
    <>
      <SEO
        title="Sahadhyayi - Digital Reading Community & Book Library | Fellow Readers Platform"
        description="Sahadhyayi means 'fellow reader' in Sanskrit. Join our vibrant digital reading community. Discover books, connect with readers, publish articles, play book quizzes, and more."
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'fellow reader', 'digital reading community', 'book library', 'reading platform', 'book quiz', 'publish articles']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Hero */}
      <AnimatedHero />

      {/* Current Reads for signed-in users */}
      {user && (
        <section className="py-10 sm:py-14 px-4 bg-gradient-to-br from-brand-primary/5 via-background to-brand-secondary/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader'}! 📖
              </h2>
              <p className="text-muted-foreground">Continue your reading journey</p>
            </div>
            <CurrentReads />
            <div className="text-center mt-8">
              <Link to="/dashboard">
                <Button className="bg-gradient-button text-white px-8">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── NEW: Feature Spotlight ─── */}
      <section className="py-14 sm:py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge icon={<Sparkles className="w-4 h-4" />} text="What's New" />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-4 mb-3">
              More Than Just Reading
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Write, play, discover, and connect — Sahadhyayi is your complete literary world.
            </p>
          </div>

          {/* 3 spotlight cards for new features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <SpotlightCard
              to="/blog"
              icon={<PenTool className="w-7 h-7" />}
              gradient="from-violet-500/15 to-purple-500/15"
              iconBg="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              title="Publish & Blog"
              description="Write articles, share book reviews, and build your voice in the reading community."
              cta="Start Writing"
            />
            <SpotlightCard
              to="/games"
              icon={<Gamepad2 className="w-7 h-7" />}
              gradient="from-amber-500/15 to-orange-500/15"
              iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              title="Book Quizzes & Games"
              description="Test your knowledge, earn badges, and compete on leaderboards with fellow readers."
              cta="Play Now"
            />
            <SpotlightCard
              to="/articles"
              icon={<Newspaper className="w-7 h-7" />}
              gradient="from-emerald-500/15 to-teal-500/15"
              iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              title="Articles & Insights"
              description="Discover curated articles, reading tips, and literary analysis from the community."
              cta="Browse Articles"
            />
          </div>
        </div>
      </section>

      {/* ─── Core Features Grid ─── */}
      <section className="py-14 sm:py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Everything a Reader Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From discovering your next read to connecting with authors and fellow readers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={BookOpen} title="Digital Library" desc="Browse thousands of books with smart search, filters, and instant reading." to="/library" />
            <FeatureCard icon={Users} title="Authors Directory" desc="Discover authors, follow their work, and explore their book catalogs." to="/authors" />
            <FeatureCard icon={Globe} title="Social Community" desc="Share posts, join discussions, and connect with readers who share your taste." to="/social" />
            <FeatureCard icon={Map} title="Reader Map" desc="Find readers near you, form local clubs, and host in-person meetups." to="/map" />
            <FeatureCard icon={Star} title="Book Reviews" desc="Read authentic community reviews and rate books you've finished." to="/library" />
            <FeatureCard icon={Headphones} title="Audio Summaries" desc="Listen to AI-generated book summaries when you're on the go." to="/library" />
          </div>
        </div>
      </section>

      {/* ─── Stats & Social Proof ─── */}
      <section className="py-14 sm:py-20 px-4 bg-gradient-to-br from-brand-primary/8 via-background to-brand-secondary/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
            <StatBlock value="5,000+" label="Books Available" />
            <StatBlock value="1,200+" label="Active Readers" />
            <StatBlock value="300+" label="Authors" />
            <StatBlock value="50+" label="Reading Groups" />
          </div>

          {/* What is Sahadhyayi — concise version */}
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    What is <span className="text-brand-primary">Sahadhyayi</span>?
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    <strong className="text-foreground">Sahadhyayi</strong> (सहाध्यायी) is Sanskrit for "fellow reader" — from <em>saha</em> (together) and <em>adhyayi</em> (one who reads). We're building a digital home where readers connect, share insights, and grow together.
                  </p>
                  <Link to="/about" className="text-brand-primary hover:underline font-medium text-sm flex items-center gap-1 w-fit">
                    Learn more about our mission <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 p-8 sm:p-10 flex flex-col justify-center space-y-4">
                  <QuickBenefit emoji="📚" title="Deep Reading" text="Rediscover focused, meaningful reading" />
                  <QuickBenefit emoji="🤝" title="Community" text="Learn through shared insights with fellow readers" />
                  <QuickBenefit emoji="🏆" title="Gamified Learning" text="Earn badges and climb leaderboards" />
                  <QuickBenefit emoji="✍️" title="Publish & Share" text="Write articles and share your perspective" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      {!user && (
        <section className="py-14 sm:py-20 px-4 bg-foreground text-background">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Your Reading Journey?</h2>
            <p className="text-lg opacity-80 mb-8">
              Join Sahadhyayi today — it's free and takes less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="px-8 text-base">
                  <UserPlus className="w-5 h-5 mr-2" /> Get Started Free
                </Button>
              </Link>
              <Link to="/library">
                <Button size="lg" variant="outline" className="px-8 text-base border-background/30 text-background hover:bg-background/10">
                  Browse Library
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

/* ─── Sub-components ─── */

const Badge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
    {icon} {text}
  </span>
);

const SpotlightCard = ({
  to, icon, gradient, iconBg, title, description, cta
}: {
  to: string; icon: React.ReactNode; gradient: string; iconBg: string;
  title: string; description: string; cta: string;
}) => (
  <Link to={to} className="group block">
    <Card className={`h-full border-border hover:shadow-[var(--shadow-elevated)] transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-gradient-to-br ${gradient}`}>
      <CardContent className="p-6 sm:p-8 flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${iconBg} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{description}</p>
        <span className="text-sm font-semibold text-brand-primary flex items-center gap-1 group-hover:gap-2 transition-all">
          {cta} <ArrowRight className="w-4 h-4" />
        </span>
      </CardContent>
    </Card>
  </Link>
);

const FeatureCard = ({ icon: Icon, title, desc, to }: { icon: React.ElementType; title: string; desc: string; to: string }) => (
  <Link to={to} className="group block">
    <Card className="h-full border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 bg-card">
      <CardContent className="p-6">
        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary/15 transition-colors">
          <Icon className="w-5 h-5 text-brand-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  </Link>
);

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const QuickBenefit = ({ emoji, title, text }: { emoji: string; title: string; text: string }) => (
  <div className="flex items-start gap-3">
    <span className="text-xl flex-shrink-0">{emoji}</span>
    <div>
      <span className="font-semibold text-foreground text-sm">{title}:</span>{' '}
      <span className="text-muted-foreground text-sm">{text}</span>
    </div>
  </div>
);

export default Index;
