
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, MapPin, UsersIcon, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
import { SocialFeed } from '@/components/social/SocialFeed';
import { EnhancedReadingMap } from '@/components/social/EnhancedReadingMap';
import { FriendsLocationMap } from '@/components/social/FriendsLocationMap';
import { ReadingGroups } from '@/components/social/ReadingGroups';
import { EnhancedFriendsManager } from '@/components/social/EnhancedFriendsManager';

const SocialMedia = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(!user);

  useEffect(() => {
    setShowAuthModal(!user);
  }, [user]);

  const handleModalClose = () => {
    setShowAuthModal(false);
    navigate('/', { replace: true });
  };

  if (!user) {
    return (
      <>
        <SEO
          title="Social Reading Community - Sign In Required | Sahadhyayi"
          description="Join Sahadhyayi's social reading community. Sign in to connect with fellow readers and share your reading journey."
          canonical="https://sahadhyayi.com/social"
          url="https://sahadhyayi.com/social"
        />
        
        <Dialog open={showAuthModal} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-gray-900">
                Welcome to Sahadhyayi's Social Reading Community!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-6 py-4">
              <p className="text-gray-600">
                Please sign in to access Sahadhyayi's Social Reading Community!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <SignInLink>
                  <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                    Sign In
                  </Button>
                </SignInLink>
                <Link to="/signup">
                  <Button variant="outline" className="w-full sm:w-auto border-orange-300 text-orange-700 hover:bg-orange-50">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Social Reading Community | Sahadhyayi"
        description="Connect with fellow readers, share your reading journey, and discover new books through our vibrant social community."
        canonical="https://sahadhyayi.com/social"
        url="https://sahadhyayi.com/social"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        {/* Improved Header with better spacing */}
        <div className="bg-white/90 backdrop-blur-md border-b border-orange-200 shadow-sm sticky top-0 z-50 pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Social Community</h1>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                Connect with fellow readers and share your reading journey
              </p>
            </div>
          </div>
        </div>

        {/* Main Content with improved layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs defaultValue="feed" className="w-full">
            {/* Improved tabs design */}
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/90 backdrop-blur-sm border border-orange-200 rounded-2xl p-1 shadow-lg">
              <TabsTrigger 
                value="feed" 
                className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger 
                value="friends" 
                className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-md"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Friends</span>
              </TabsTrigger>
              <TabsTrigger 
                value="map" 
                className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-md"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:shadow-md"
              >
                <UsersIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg p-6">
                <SocialFeed />
              </div>
            </TabsContent>

            <TabsContent value="friends" className="mt-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200 shadow-lg p-6">
                <EnhancedFriendsManager />
              </div>
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200 shadow-lg p-6">
                  <EnhancedReadingMap />
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200 shadow-lg p-6">
                  <FriendsLocationMap />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-lg p-6">
                <ReadingGroups />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SocialMedia;
