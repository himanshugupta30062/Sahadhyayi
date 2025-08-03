import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
    title: "Digital Book Library",
    tagline: "A universe of books, always within reach.",
    detail: "Access thousands of curated ebooks, audiobooks, and niche content in English, Hindi, and regional languages. Personalized collections help users discover hidden gems.",
    metric: "Readers find 3x more relevant books through our smart shelving and curation.",
    icon: Library
  },
  {
    id: 2,
    title: "Intelligent Book Discovery", 
    tagline: "What to read next—without the guesswork.",
    detail: "Recommendations adapt based on your reading history, community trends, and similarity to books you've loved.",
    metric: "Users engage 40% longer when suggestions align with their evolving interests.",
    icon: Search
  },
  {
    id: 3,
    title: "Social Reading Circles & Book Clubs",
    tagline: "Read together. Discuss deeper.",
    detail: "Join or create thematic reading circles, host timed group reads, and participate in guided discussions. Integrated chat and highlight-sharing keep everyone in sync.",
    metric: "Monthly clubs drive 25% higher retention and repeat visits.",
    icon: Users
  }
];

const SahadhyayiCapabilities: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate every second when not hovered
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % capabilities.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  return (
    <section className="py-16 px-4 bg-black text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Sahadhyayi's <span className="text-blue-400">Capabilities</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Discover how Sahadhyayi transforms reading into community, insight, and influence—bringing books, people, and ideas together in one intelligent ecosystem.
          </p>
        </div>

        {/* Cards Carousel */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            const isActive = index === currentIndex;
            
            return (
              <Card 
                key={capability.id}
                className={`transition-all duration-500 cursor-pointer transform ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white scale-105 shadow-2xl border-blue-400' 
                    : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500 hover:scale-102'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-white/20' : 'bg-blue-500/20'
                  }`}>
                    <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-3 ${isActive ? 'text-white' : 'text-white'}`}>
                    {capability.title}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {capability.tagline}
                  </p>
                  
                  <p className={`text-sm leading-relaxed mb-4 ${isActive ? 'text-blue-50' : 'text-gray-500'}`}>
                    {capability.detail}
                  </p>
                  
                  {isActive && (
                    <div className="bg-white/10 border border-white/20 rounded-lg p-3 mt-4">
                      <p className="text-blue-100 font-medium text-xs">
                        📊 {capability.metric}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2">
          {capabilities.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
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