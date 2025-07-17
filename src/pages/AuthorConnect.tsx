
import React, { useState } from 'react';
import { Users, Calendar, Search } from 'lucide-react';
import AuthorGrid from '@/components/authors/AuthorGrid';
import AuthorSearch from '@/components/authors/AuthorSearch';
import SEO from '@/components/SEO';

const AuthorConnect = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('rating');

  const authors = [
    {
      id: "1",
      name: "Dr. Rajesh Kumar",
      genre: "Science Fiction",
      books: ["Quantum Dreams", "The Neural Network"],
      rating: 4.8,
      followers_count: 15000,
      bio: "Award-winning science fiction author with a PhD in Physics. Specializes in hard science fiction that explores the intersection of quantum mechanics and human consciousness.",
      profile_image_url: "",
      availableSlots: ["Dec 15, 2024", "Dec 22, 2024", "Jan 5, 2025"],
      nextSession: "Dec 15, 2024 at 3:00 PM IST",
      location: "New Delhi, India",
      website_url: null,
      social_links: {},
      books_count: 2,
      upcoming_events: 3,
      genres: ["Science Fiction", "Hard Science Fiction"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
      name: "Priya Sharma",
      genre: "Contemporary Fiction",
      books: ["Mumbai Monsoons", "Threads of Tradition"],
      rating: 4.9,
      followers_count: 22000,
      bio: "Contemporary fiction author focusing on modern Indian experiences. Her works explore themes of identity, family, and cultural transition in urban India.",
      profile_image_url: "",
      availableSlots: ["Dec 18, 2024", "Dec 25, 2024", "Jan 8, 2025"],
      nextSession: "Dec 18, 2024 at 7:00 PM IST",
      location: "Mumbai, India",
      website_url: null,
      social_links: {},
      books_count: 2,
      upcoming_events: 2,
      genres: ["Contemporary Fiction", "Indian Literature"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "3",
      name: "Arjun Mehta",
      genre: "Historical Fiction",
      books: ["The Last Mughal", "Swords of Swaraj"],
      rating: 4.7,
      followers_count: 18500,
      bio: "Historical fiction specialist with deep knowledge of Indian history. Brings historical events to life through compelling narratives and well-researched storytelling.",
      profile_image_url: "",
      availableSlots: ["Dec 20, 2024", "Jan 3, 2025", "Jan 10, 2025"],
      nextSession: "Dec 20, 2024 at 4:00 PM IST",
      location: "Delhi, India",
      website_url: null,
      social_links: {},
      books_count: 2,
      upcoming_events: 1,
      genres: ["Historical Fiction", "Indian History"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.books?.some(book => book.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <SEO
        title="Connect with Authors - Schedule Sessions & Get Guidance | Sahadhyayi"
        description="Connect directly with published authors on Sahadhyayi. Schedule one-on-one sessions, get writing guidance, and learn from experienced writers in our author community."
        canonical="https://sahadhyayi.com/authors"
        url="https://sahadhyayi.com/authors"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        {/* Hero Section with increased top margin */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg mt-16 md:mt-20" style={{scrollMarginTop: '80px'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Meet Our Authors
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-orange-100 max-w-3xl mx-auto mb-8 leading-relaxed">
                Connect with experienced writers and get personalized guidance for your literary journey.
              </p>
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <span className="text-lg text-orange-100">Schedule Live Sessions</span>
              </div>
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <span className="text-lg text-orange-100">Search by Genre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AuthorSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        </div>

        {/* Authors Grid with increased top margin */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" style={{marginTop: '30px'}}>
          <AuthorGrid authors={filteredAuthors} />
        </div>
      </div>
    </>
  );
};

export default AuthorConnect;
