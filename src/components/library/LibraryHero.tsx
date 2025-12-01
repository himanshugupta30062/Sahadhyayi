import React, { useState } from 'react';
import { BookOpen, Search, TrendingUp, Users, Star, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import libraryBg from '@/assets/library-hero-bg.jpg';

interface LibraryHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  totalBooks?: number;
  activeReaders?: number;
  avgRating?: number;
  booksAddedToday?: number;
}

const LibraryHero = ({ 
  searchQuery, 
  onSearchChange, 
  onSearch, 
  totalBooks = 10000,
  activeReaders = 2847,
  avgRating = 4.8,
  booksAddedToday = 47
}: LibraryHeroProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const stats = [
    { icon: BookOpen, label: 'Books Available', value: totalBooks.toLocaleString(), color: 'text-library-primary' },
    { icon: Users, label: 'Active Readers', value: activeReaders.toLocaleString(), color: 'text-library-secondary' },
    { icon: Star, label: 'Avg Rating', value: avgRating.toString(), color: 'text-yellow-600' },
    { icon: TrendingUp, label: 'Books Added Today', value: booksAddedToday.toString(), color: 'text-green-600' },
  ];

  return (
    <div className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${libraryBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Floating book icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-float text-white/20 ${
              i % 2 === 0 ? 'animate-bounce-subtle' : 'animate-float'
            }`}
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              fontSize: `${1.5 + (i % 2) * 0.5}rem`
            }}
          >
            {i % 3 === 0 ? <BookOpen /> : i % 3 === 1 ? <Star /> : <Sparkles />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] px-4 sm:px-6 py-8 sm:py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Title */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-library-primary to-library-secondary rounded-xl sm:rounded-2xl shadow-2xl transform rotate-3">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight">
                Digital Library
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-medium px-2">
              Discover Your Next Great Adventure
            </p>
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed px-4">
              Explore our vast collection of digital books. From timeless classics to contemporary masterpieces, 
              find your perfect read with our intelligent search and personalized recommendations.
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto relative z-50 px-2 sm:px-0">
            <div className={`relative transform transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
              <div className="relative">
                <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 sm:h-6 sm:w-6 z-10" />
                <Input
                  type="text"
                  placeholder="Search books, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                  className="pl-12 sm:pl-14 pr-24 sm:pr-32 py-4 sm:py-6 text-base sm:text-lg bg-white/95 backdrop-blur-sm border-0 rounded-xl sm:rounded-2xl shadow-2xl focus:bg-white focus:shadow-3xl transition-all duration-300 relative z-10"
                />
                <Button
                  onClick={onSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-library-primary to-library-secondary hover:from-library-secondary hover:to-library-primary text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg transition-all duration-200 z-20"
                >
                  Search
                </Button>
              </div>
              
              {/* Search suggestions overlay */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border p-4 z-[9999]">
                  <div className="text-sm text-gray-600 mb-2">Popular searches:</div>
                  <div className="flex flex-wrap gap-2">
                    {['Fiction', 'Science', 'History', 'Biography', 'Philosophy'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onSearchChange(tag);
                          onSearch();
                          setIsSearchFocused(false);
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-library-primary hover:text-white rounded-full text-sm transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats - Improved design with smaller cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg transform hover:scale-105 transition-all duration-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                  <div className={`p-1.5 sm:p-2 rounded-full bg-gray-100 ${stat.color}`}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-600 text-center leading-tight">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryHero;