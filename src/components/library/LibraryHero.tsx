import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, TrendingUp, Users, Star, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import useDebouncedValue from '@/lib/useDebouncedValue';
import { Link } from 'react-router-dom';
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  
  // Fetch book suggestions based on search query
  const { data: suggestions = [], isLoading } = useLibraryBooks(
    debouncedSearchQuery && debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : undefined
  );

  // Show only top 6 suggestions
  const limitedSuggestions = suggestions.slice(0, 6);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (bookTitle: string) => {
    onSearchChange(bookTitle);
    setShowSuggestions(false);
    setIsSearchFocused(false);
    onSearch();
  };

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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] px-4 sm:px-6 py-8 sm:py-12 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 w-full">
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
          <div className="max-w-2xl mx-auto relative z-50 px-2 sm:px-0" ref={searchRef}>
            <div className={`relative transform transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
              <div className="relative">
                <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 sm:h-6 sm:w-6 z-10" />
                <Input
                  type="text"
                  placeholder="Search books, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setShowSuggestions(true);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onSearch();
                      setShowSuggestions(false);
                    }
                  }}
                  className="pl-12 sm:pl-14 pr-24 sm:pr-32 py-4 sm:py-6 text-base sm:text-lg bg-white/95 backdrop-blur-sm border-0 rounded-xl sm:rounded-2xl shadow-2xl focus:bg-white focus:shadow-3xl transition-all duration-300 relative z-10"
                  autoComplete="off"
                />
                <Button
                  onClick={() => {
                    onSearch();
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-library-primary to-library-secondary hover:from-library-secondary hover:to-library-primary text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg transition-all duration-200 z-20"
                >
                  Search
                </Button>
              </div>
              
              {/* Dynamic Search Suggestions Dropdown */}
              {showSuggestions && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999] max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-pulse">Searching...</div>
                    </div>
                  ) : limitedSuggestions.length > 0 ? (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          Suggestions ({limitedSuggestions.length})
                        </span>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {limitedSuggestions.map((book) => (
                          <li key={book.id}>
                            <button
                              onClick={() => handleSuggestionClick(book.title)}
                              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-3 group"
                            >
                              {book.cover_image_url ? (
                                <img
                                  src={book.cover_image_url}
                                  alt={book.title}
                                  className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-gradient-to-br from-library-primary to-library-secondary rounded flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 group-hover:text-library-primary transition-colors line-clamp-1">
                                  {book.title}
                                </div>
                                <div className="text-sm text-gray-600 line-clamp-1">
                                  {book.author}
                                </div>
                                {book.genre && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {book.genre}
                                  </div>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <button
                          onClick={() => {
                            onSearch();
                            setShowSuggestions(false);
                          }}
                          className="text-sm text-library-primary hover:text-library-secondary font-medium transition-colors"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-sm">No books found for "{searchQuery}"</div>
                      <div className="text-xs text-gray-400 mt-1">Try different keywords</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Popular searches when no query */}
              {showSuggestions && searchQuery.trim().length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-[9999]">
                  <div className="text-sm text-gray-600 font-medium mb-3">Popular searches:</div>
                  <div className="flex flex-wrap gap-2">
                    {['Fiction', 'Science', 'History', 'Biography', 'Philosophy', 'Technology'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onSearchChange(tag);
                          setShowSuggestions(false);
                          onSearch();
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-library-primary hover:text-white rounded-full text-sm transition-colors font-medium"
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
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                    <div className={`p-1.5 sm:p-2 rounded-full bg-gray-100 ${stat.color}`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 text-center leading-tight px-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryHero;