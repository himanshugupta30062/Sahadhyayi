
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, MessageSquare, Heart, Share2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { LeftSidebar } from '@/components/reviews/LeftSidebar';
import { ReadingFeed } from '@/components/reviews/ReadingFeed';
import { RightSidebar } from '@/components/reviews/RightSidebar';
import { FloatingChat } from '@/components/reviews/FloatingChat';

const Reviews = () => {
  return (
    <>
      <SEO
        title="Social Reading Community - Share Reviews & Connect | Sahadhyayi"
        description="Join Sahadhyayi's vibrant social reading community. Share book reviews, connect with fellow readers, and discover your next favorite book through community recommendations."
        canonical="https://sahadhyayi.com/reviews"
        url="https://sahadhyayi.com/reviews"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        {/* Fixed Social Media Section Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  Social Reading Community
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-orange-100 max-w-3xl mx-auto mb-6 leading-relaxed">
                Connect with fellow readers, share your thoughts, and discover amazing books through our vibrant community.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-orange-100">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                  <span>Active Discussions</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                  <Heart className="w-4 h-4" />
                  <span>Book Reviews</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                  <Share2 className="w-4 h-4" />
                  <span>Reading Updates</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending Books</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <LeftSidebar onSelectConversation={() => {}} />
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-2">
              <ReadingFeed />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <RightSidebar />
            </div>
          </div>
        </div>

        {/* Welcome Section for New Users */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-orange-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Our Reading Community!
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Join thousands of passionate readers sharing their favorite books, writing reviews, 
                and discovering new literary adventures together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/library">
                  <Button className="bg-orange-600 hover:bg-orange-700 px-6 py-3">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Our Library
                  </Button>
                </Link>
                <Link to="/groups">
                  <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50 px-6 py-3">
                    <Users className="w-4 h-4 mr-2" />
                    Join Reading Groups
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Chat Component */}
        <FloatingChat />
      </div>
    </>
  );
};

export default Reviews;
