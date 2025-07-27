
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones, LogIn, UserPlus, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SignInLink from '@/components/SignInLink';
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";

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
      "logo": "https://sahadhyayi.com/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png",
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
      <div className="min-h-screen bg-gradient-to-br from-sahadhyayi-amber-light via-sahadhyayi-orange-light to-background">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 px-4 text-center">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sahadhyayi-orange opacity-5 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-sahadhyayi-amber opacity-5 rounded-full blur-3xl animate-float delay-2000"></div>
          </div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex justify-center mb-8 sm:mb-10">
              <div className="relative">
                <img
                  src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
                  alt="Sahadhyayi logo - Fellow Reader community platform in Sanskrit"
                  loading="lazy"
                  className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 drop-shadow-lg"
                />
                <div className="absolute inset-0 bg-sahadhyayi-orange opacity-20 rounded-full blur-xl"></div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-sahadhyayi-warm mb-6 sm:mb-8 leading-tight">
              Rediscover the Joy of
              <span className="block text-transparent bg-clip-text bg-gradient-primary mt-2"> Deep Reading</span>
            </h1>
            
            <div className="space-y-4 mb-8 sm:mb-12">
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 leading-relaxed font-medium px-4">
                Connect, read, and grow with thousands of fellow readers worldwide.
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed px-4">
                Join <strong className="text-sahadhyayi-orange">Sahadhyayi</strong>—the digital community bringing meaningful reading back into focus.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-gray-500 italic px-4">
                Because reading deeply is reading differently.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 max-w-2xl mx-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="btn-primary w-full sm:w-auto px-8 sm:px-10 py-4 text-lg sm:text-xl font-semibold">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  Join Our Reading Community (Free!)
                </Button>
              </Link>
              <SignInLink className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="btn-secondary w-full sm:w-auto px-8 sm:px-10 py-4 text-lg sm:text-xl font-semibold">
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  Sign In
                </Button>
              </SignInLink>
            </div>
          </div>
        </section>

        {/* What Sahadhyayi Means Section */}
        <section className="py-12 sm:py-16 px-4 bg-white/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">What is Sahadhyayi? Understanding Our Name</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="text-left">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">The Sanskrit Meaning of Sahadhyayi</h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  <strong>Sahadhyayi</strong> (सहाध्यायी) is a beautiful Sanskrit word meaning "fellow reader" or "study companion." 
                  It comes from "saha" (together) and "adhyayi" (one who reads or studies). In ancient tradition, 
                  a Sahadhyayi was someone who studied alongside you, shared knowledge, and deepened understanding together.
                </p>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Why We Chose the Name Sahadhyayi</h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Sahadhyayi creates a digital home for readers to connect, share insights, and support each other's reading journey.
                  <Link to="/about" className="text-orange-600 hover:text-orange-700 font-medium ml-1">Learn more about our mission</Link>.
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-red-100 p-6 sm:p-8 rounded-2xl backdrop-blur-sm border border-orange-200 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Why Choose Sahadhyayi for Reading</h3>
                <div className="space-y-3 text-gray-700 text-sm sm:text-base">
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl">🌎</span>
                    <div>
                      <strong>Global Community:</strong> Meet readers who share your passion.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl">📚</span>
                    <div>
                      <strong>Deep Reading:</strong> Rediscover focused, meaningful reading.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl">🤝</span>
                    <div>
                      <strong>Collaborative Learning:</strong> Grow through shared insights.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl">🕯️</span>
                    <div>
                      <strong>Ancient Wisdom, Modern Tech:</strong> Blending tradition with innovation.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl">🗣️</span>
                    <div>
                      <strong>Shared Perspectives:</strong> Gain diverse insights from readers worldwide.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg sm:text-xl">💬</span>
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
        <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">How Sahadhyayi Revives Reading Culture</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="text-left">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">The Digital Reading Challenge</h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  Modern digital consumption habits are shifting away from deep reading toward passive content like videos and podcasts. 
                  This change impacts our ability to focus deeply, comprehend complex ideas, and engage in meaningful reflection.
                </p>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Sahadhyayi's Revolutionary Solution</h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Sahadhyayi creates a social reading platform that makes books more accessible, interactive, and community-driven. 
                  We combine traditional reading with modern technology to build healthier intellectual habits among fellow readers.
                  <Link to="/blog" className="text-orange-600 hover:text-orange-700 font-medium ml-1">Read our blog posts</Link> about reading culture.
                </p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-2xl backdrop-blur-sm border border-orange-200 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Benefits of the Sahadhyayi Approach</h3>
                <ul className="space-y-3 text-gray-700 text-sm sm:text-base">
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
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sahadhyayi-warm mb-6">Explore Sahadhyayi's Powerful Tools</h2>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed">
                Our features are designed to help you read better, understand deeper, and connect meaningfully with fellow readers worldwide.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="card-elegant group hover:scale-105 transition-all duration-300">
                    <CardHeader className="pb-6">
                      <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white drop-shadow-sm" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl text-sahadhyayi-warm mb-3">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Updated Internal Links Section with Equal Sized Cards */}
        <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Explore the Sahadhyayi Platform</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Link to="/library" className="block">
                <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-6 sm:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 mx-auto mb-4 sm:mb-6" />
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Digital Library</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Browse thousands of books with fellow readers in our comprehensive digital collection</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/groups" className="block">
                <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-6 sm:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <Users className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 mx-auto mb-4 sm:mb-6" />
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Reading Groups</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Join meaningful discussions with fellow Sahadhyayi readers who share your literary interests</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/map" className="block">
                <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-6 sm:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <Map className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 mx-auto mb-4 sm:mb-6" />
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Reader Map</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Find and connect with local Sahadhyayi members and book communities in your area</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/authors" className="block">
                <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-6 sm:p-8 text-center flex flex-col justify-between h-full">
                    <div>
                      <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 mx-auto mb-4 sm:mb-6" />
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Meet Authors</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Connect directly with inspiring authors through live Sahadhyayi sessions and Q&As</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Start Your Reading Journey?</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 px-4">
              Join Sahadhyayi today and experience the joy of reading together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-orange-600 px-6 sm:px-8 py-3 text-base sm:text-lg">
                  Learn More About Sahadhyayi
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
