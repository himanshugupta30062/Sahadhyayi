
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones, LogIn, UserPlus, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SignInLink from '@/components/SignInLink';
import { useAuth } from "@/contexts/authHelpers";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";
import AnimatedHero from "@/components/AnimatedHero";
import SahadhyayiCircuit from "@/components/SahadhyayiCircuit";
import SahadhyayiCapabilities from "@/components/SahadhyayiCapabilities";
import CurrentReads from "@/components/library/CurrentReads";

const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "Personal Bookshelf",
      description: "Track and manage your reading journey effortlessly."
    },
    {
      icon: Users,
      title: "Global Reading Groups",
      description: "Engage in book discussions worldwide."
    },
    {
      icon: Map,
      title: "Find Local Readers",
      description: "Discover local book lovers through our interactive map."
    },
    {
      icon: Calendar,
      title: "Author Connect",
      description: "Participate in live sessions with your favorite authors."
    },
    {
      icon: Star,
      title: "Community Reviews",
      description: "Read authentic book reviews from fellow readers."
    },
    {
      icon: Headphones,
      title: "AI Reading Assistant",
      description: "Instant definitions and explanations as you read."
    }
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
      "foundingDate": "2024",
      "mission": "To revive deep reading culture and connect readers worldwide as fellow study companions (Sahadhyayi)",
      "sameAs": [
        "https://sahadhyayi.com/library",
        "https://sahadhyayi.com/authors",
        "https://sahadhyayi.com/about"
      ]
    }
  };

  return (
    <>
      <SEO
        title="Sahadhyayi - Digital Reading Community & Book Library | Fellow Readers Platform"
        description="Sahadhyayi means 'fellow reader' in Sanskrit. Join our vibrant digital reading community and book reader social media platform. Discover thousands of books, connect with fellow readers, track your progress, and explore our comprehensive digital library with your study companions."
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'fellow reader', 'Sanskrit meaning', 'digital reading community', 'book library', 'reading platform', 'study companions', 'book lovers']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      {/* Animated Hero Section */}
      <AnimatedHero />
      <div className="page-container">
        <SahadhyayiCircuit />

        <SahadhyayiCapabilities />

        {/* Current Reads Section for Signed-in Users */}
        {user && (
          <section className="py-8 sm:py-12 lg:py-16 bg-neutral">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-4">
                  Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader'}!
                </h2>
                <p className="text-lg">Continue your reading journey</p>
              </div>
              <CurrentReads />

              <div className="text-center mt-8">
                <Link to="/dashboard">
                  <Button className="btn-primary px-8 py-3">
                    Go to Full Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="bg-brand text-white">
        <div className="page-container">

        {/* What Sahadhyayi Means Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-100 mb-4 sm:mb-6 lg:mb-8">What is Sahadhyayi? Understanding Our Name</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="text-left order-2 lg:order-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100 mb-2 sm:mb-3 lg:mb-4">The Sanskrit Meaning of Sahadhyayi</h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed mb-3 sm:mb-4 lg:mb-6">
                  <strong>Sahadhyayi</strong> (सहाध्यायी) is a beautiful Sanskrit word meaning "fellow reader" or "study companion."
                  It comes from "saha" (together) and "adhyayi" (one who reads or studies). In ancient tradition,
                  a Sahadhyayi was someone who studied alongside you, shared knowledge, and deepened understanding together.
                </p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Why We Chose the Name Sahadhyayi</h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
                  Sahadhyayi creates a digital home for readers to connect, share insights, and support each other's reading journey.
                  <Link to="/about" className="text-orange-400 hover:text-orange-500 font-medium ml-1">Learn more about our mission</Link>.
                </p>
              </div>
              <div className="bg-black p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-sm border border-orange-700 shadow-lg order-1 lg:order-2">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100 mb-3 sm:mb-4">Why Choose Sahadhyayi for Reading</h3>
                <div className="space-y-2 sm:space-y-3 text-gray-300 text-xs sm:text-sm lg:text-base">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">🌎</span>
                    <div>
                      <strong>Global Community:</strong> Meet readers who share your passion.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">📚</span>
                    <div>
                      <strong>Deep Reading:</strong> Rediscover focused, meaningful reading.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">🤝</span>
                    <div>
                      <strong>Collaborative Learning:</strong> Grow through shared insights.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">🕯️</span>
                    <div>
                      <strong>Ancient Wisdom, Modern Tech:</strong> Blending tradition with innovation.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">🗣️</span>
                    <div>
                      <strong>Shared Perspectives:</strong> Gain diverse insights from readers worldwide.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg lg:text-xl flex-shrink-0">💬</span>
                    <div>
                      <strong>Lasting Connections:</strong> Build friendships through shared reading.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-100 mb-4 sm:mb-6 lg:mb-8">How Sahadhyayi Revives Reading Culture</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="text-left order-2 lg:order-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100 mb-2 sm:mb-3 lg:mb-4">The Digital Reading Challenge</h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed mb-3 sm:mb-4 lg:mb-6">
                  Modern digital consumption habits are shifting away from deep reading toward passive content like videos and podcasts.
                  This change impacts our ability to focus deeply, comprehend complex ideas, and engage in meaningful reflection.
                </p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Sahadhyayi's Revolutionary Solution</h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
                  Sahadhyayi creates a social reading platform that makes books more accessible, interactive, and community-driven.
                  We combine traditional reading with modern technology to build healthier intellectual habits among fellow readers.
                  <Link to="/blog" className="text-orange-400 hover:text-orange-500 font-medium ml-1">Read our blog posts</Link> about reading culture.
                </p>
              </div>
              <div className="bg-black p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-sm border border-orange-700 shadow-lg order-1 lg:order-2">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-100 mb-3 sm:mb-4">Benefits of the Sahadhyayi Approach</h3>
                <ul className="space-y-2 sm:space-y-3 text-gray-300 text-xs sm:text-sm lg:text-base">
                  <li>• <strong>Improved Focus:</strong> Deep reading enhances attention span significantly</li>
                  <li>• <strong>Better Comprehension:</strong> Fellow readers help deepen understanding</li>
                  <li>• <strong>Community Support:</strong> Study companions motivate consistent reading</li>
                  <li>• <strong>Knowledge Retention:</strong> Collaborative learning builds lasting memories</li>
                  <li>• <strong>Critical Thinking:</strong> Discussions with fellow readers enhance analysis</li>
                  <li>• <strong>Intellectual Growth:</strong> Sahadhyayi connections foster lifelong learning</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-8 sm:py-12 lg:py-16 px-4 bg-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-center text-gray-100 mb-2 sm:mb-3 lg:mb-4">Explore Sahadhyayi's Powerful Tools</h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300 text-center mb-6 sm:mb-8 lg:mb-12 max-w-3xl mx-auto px-4">
              Our features are designed to help you read better, understand deeper, and connect meaningfully.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-black/80 backdrop-blur-sm border-orange-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-900 rounded-lg flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-400" />
                      </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl text-gray-100">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs sm:text-sm lg:text-base text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Updated Internal Links Section with Equal Sized Cards */}
        <section className="py-8 sm:py-12 lg:py-16 px-4 bg-black">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-100 mb-4 sm:mb-6 lg:mb-8">Explore the Sahadhyayi Platform</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              <Link to="/library" className="block">
                <Card className="bg-black border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-orange-600 mx-auto mb-3 sm:mb-4 lg:mb-6" />
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Digital Library</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed">Browse thousands of books with fellow readers in our comprehensive digital collection</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/groups" className="block">
                <Card className="bg-black border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <Users className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-orange-600 mx-auto mb-3 sm:mb-4 lg:mb-6" />
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Reading Groups</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed">Join meaningful discussions with fellow Sahadhyayi readers who share your literary interests</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/map" className="block">
                <Card className="bg-black border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <Map className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-orange-600 mx-auto mb-3 sm:mb-4 lg:mb-6" />
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Reader Map</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed">Find and connect with local Sahadhyayi members and book communities in your area</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/authors" className="block">
                <Card className="bg-black border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <Calendar className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-orange-600 mx-auto mb-3 sm:mb-4 lg:mb-6" />
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-100 mb-2 sm:mb-3 lg:mb-4">Meet Authors</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed">Connect directly with inspiring authors through live Sahadhyayi sessions and Q&As</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 sm:py-12 lg:py-16 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 lg:mb-6">Ready to Start Your Reading Journey?</h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90">
              Join Sahadhyayi today and experience the joy of reading together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto btn-primary px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg">
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto btn-primary px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg">
                  Learn More About Sahadhyayi
                </Button>
              </Link>
            </div>
          </div>
        </section>
        </div>
      </div>
    </>
  );
};

export default Index;
