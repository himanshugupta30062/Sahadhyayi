
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, MapPin, UsersIcon, Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { SocialFeed } from '@/components/social/SocialFeed';
import { SocialFriends } from '@/components/social/SocialFriends';
import { ReadingMap } from '@/components/social/ReadingMap';
import { ReadingGroups } from '@/components/social/ReadingGroups';
import { NotificationPanel } from '@/components/social/NotificationPanel';
import { GlobalSearch } from '@/components/social/GlobalSearch';

const SocialMedia = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(!user);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // If user is not authenticated, show modal
  if (!user) {
    return (
      <>
        <SEO
          title="Social Reading Community - Sign In Required | Sahadhyayi"
          description="Join Sahadhyayi's social reading community. Sign in to connect with fellow readers and share your reading journey."
          canonical="https://sahadhyayi.com/social"
          url="https://sahadhyayi.com/social"
        />
        
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
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
        {/* Header with Search and Notifications */}
        <div className="bg-white shadow-sm border-b border-gray-200 mt-16 md:mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Social Community</h1>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(true)}
                  className="text-gray-600 hover:text-gray-900 relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Friends</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Reading Map</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <SocialFeed />
            </TabsContent>

            <TabsContent value="friends">
              <SocialFriends />
            </TabsContent>

            <TabsContent value="map">
              <ReadingMap />
            </TabsContent>

            <TabsContent value="groups">
              <ReadingGroups />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        <NotificationPanel 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />
        <GlobalSearch 
          isOpen={showSearch} 
          onClose={() => setShowSearch(false)} 
        />
      </div>
    </>
  );
};

export default SocialMedia;
