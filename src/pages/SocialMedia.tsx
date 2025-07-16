
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, MapPin, UsersIcon, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { SocialFeed } from '@/components/social/SocialFeed';
import { EnhancedReadingMap } from '@/components/social/EnhancedReadingMap';
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
          <DialogContent className="sm:max-w-md">
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
                <Link to="/signin">
                  <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                    Sign In
                  </Button>
                </Link>
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
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Social Community</h1>
            <p className="text-gray-600 mt-2">Connect with fellow readers and share your reading journey</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white shadow-sm">
              <TabsTrigger value="feed" className="flex items-center gap-2 py-3">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2 py-3">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Friends</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2 py-3">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2 py-3">
                <UsersIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              <SocialFeed />
            </TabsContent>

            <TabsContent value="friends" className="mt-0">
              <EnhancedFriendsManager />
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <EnhancedReadingMap />
            </TabsContent>

            <TabsContent value="groups" className="mt-0">
              <ReadingGroups />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </>
  );
};

export default SocialMedia;
