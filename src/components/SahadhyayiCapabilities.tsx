import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Library, 
  Search, 
  Users, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  Star, 
  Award, 
  MapPin, 
  List 
} from "lucide-react";

interface Capability {
  id: number;
  title: string;
  tagline: string;
  detail: string;
  metric: string;
  icon: React.ElementType;
}

const capabilities: Capability[] = [
  {
    id: 1,
    title: "Vast Digital Library",
    tagline: "A universe of books, always within reach.",
    detail: "Access thousands of curated ebooks, audiobooks, and niche content in English, Hindi, and regional languages. Personalized collections help users discover hidden gems.",
    metric: "Readers find 3x more relevant books through our smart shelving and curation.",
    icon: Library
  },
  {
    id: 2,
    title: "Smart Recommendations",
    tagline: "What to read next—without the guesswork.",
    detail: "Recommendations adapt based on your reading history, community trends, and similarity to books you've loved.",
    metric: "Users engage 40% longer when suggestions align with their evolving interests.",
    icon: Search
  },
  {
    id: 3,
    title: "Community Reading Hubs",
    tagline: "Read together. Discuss deeper.",
    detail: "Join or create thematic reading circles, host timed group reads, and participate in guided discussions. Integrated chat and highlight-sharing keep everyone in sync.",
    metric: "Monthly clubs drive 25% higher retention and repeat visits.",
    icon: Users
  },
  {
    id: 4,
    title: "Direct Author Engagement",
    tagline: "Beyond the book—meet the minds behind it.",
    detail: "Live Q&As, author AMAs, writing workshops, and feedback sessions. Readers get first-hand insights and exclusive content drops.",
    metric: "Authors report a 3x increase in follower interaction after live sessions.",
    icon: Calendar
  },
  {
    id: 5,
    title: "Your Reading Dashboard",
    tagline: "Organize, track, and celebrate your journey.",
    detail: "Save favorites, mark progress, set reading goals, and revisit past discoveries with smart filters. Visual streaks and history keep motivation high.",
    metric: "Goal setters complete 60% more books per quarter than casual readers.",
    icon: BookOpen
  },
  {
    id: 6,
    title: "Insight Sharing",
    tagline: "Capture thoughts. Spark conversations.",
    detail: "Highlight passages, annotate, and optionally share with friends or public community feeds. Follow others' highlights to see why a book resonated.",
    metric: "Shared highlights increase social engagement by 50%.",
    icon: MessageSquare
  },
  {
    id: 7,
    title: "Trusted Reader Feedback",
    tagline: "Real voices, real opinions.",
    detail: "Read nuanced reviews, upvote helpful takes, and browse expert-curated lists. Weighted ratings surface what matters to you.",
    metric: "Books with community endorsements get 3x more clicks.",
    icon: Star
  },
  {
    id: 8,
    title: "Read & Earn",
    tagline: "Progress feels good—and gets noticed.",
    detail: "Earn badges for milestones (first book, streaks, reviews), unlock exclusive previews, and climb leaderboards in themed challenges.",
    metric: "Top contributors drive 30% of new user referrals through social sharing.",
    icon: Award
  },
  {
    id: 9,
    title: "Nearby Book Enthusiasts",
    tagline: "Find readers like you—in your city or neighborhood.",
    detail: "See who's reading the same book nearby, form micro-clubs, or host local meetups. Geo-aware suggestions help build real-world reading circles.",
    metric: "Local connections increase time-on-platform by 2x.",
    icon: MapPin
  },
  {
    id: 10,
    title: "Expert & Community Lists",
    tagline: "Reading made purposeful.",
    detail: "Explore lists curated by authors, power readers, and Sahadhyayi editors—seasonal themes, mood-based picks, career growth reads, and more.",
    metric: "Users following curated paths finish 80% of list titles versus 45% of random picks.",
    icon: List
  }
];

const SahadhyayiCapabilities: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start with the second card highlighted (index 1)

  const getCardClassName = (index: number) => {
    if (index === currentIndex) {
      return "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-blue-400 shadow-2xl scale-105 z-10";
    }
    return "bg-black/80 text-white border-gray-700 hover:border-gray-500 transition-all duration-300";
  };

  const handleCardClick = (index: number) => {
    setCurrentIndex(index);
  };

  const currentCapability = capabilities[currentIndex];
  const Icon = currentCapability.icon;

  return (
    <section className="py-16 px-4 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Sahadhyayi's <span className="text-blue-400">Capabilities</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Discover how Sahadhyayi transforms reading into community, insight, and influence—bringing books, people, and ideas together in one intelligent ecosystem.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {capabilities.map((capability, index) => {
            const CardIcon = capability.icon;
            return (
              <Card 
                key={capability.id}
                className={`cursor-pointer transition-all duration-500 ${getCardClassName(index)} relative`}
                onClick={() => handleCardClick(index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${index === currentIndex ? 'bg-white/20' : 'bg-blue-500/20'}`}>
                      <CardIcon className={`w-6 h-6 ${index === currentIndex ? 'text-white' : 'text-blue-400'}`} />
                    </div>
                    <h3 className="text-lg font-semibold">{capability.title}</h3>
                  </div>
                  <p className={`text-sm ${index === currentIndex ? 'text-blue-100' : 'text-gray-400'}`}>
                    {capability.tagline}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed View */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-700">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-500/20 rounded-xl">
                  <Icon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentCapability.title}</h3>
                  <p className="text-blue-400 font-medium">{currentCapability.tagline}</p>
                </div>
              </div>
              
              <p className="text-gray-300 leading-relaxed mb-6">
                {currentCapability.detail}
              </p>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-300 font-medium text-sm">
                  📊 {currentCapability.metric}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="relative">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <Icon className="w-24 h-24 text-blue-400" />
                </div>
                <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            Experience Sahadhyayi Today
          </Button>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {capabilities.map((_, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-400 scale-125' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`View capability ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiCapabilities;