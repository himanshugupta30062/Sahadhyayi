
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, MessageCircle, User, Users, Palette } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { UserProfileModal } from './UserProfileModal';
import { ChatWindow } from './ChatWindow';
import { ModernGoogleMap } from './ModernGoogleMap';
import { BitmojiCreator } from './BitmojiCreator';

interface FriendLocation {
  id: string;
  name: string;
  avatar?: string;
  lat: number;
  lng: number;
  lastSeen: string;
}

export const EnhancedReadingMap = () => {
  const [selectedFriend, setSelectedFriend] = useState<FriendLocation | null>(null);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [showBitmojiCreator, setShowBitmojiCreator] = useState(false);
  const [userBitmoji, setUserBitmoji] = useState<string | null>(
    localStorage.getItem('userBitmoji')
  );
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC

  const { data: friends = [] } = useFriends();


  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleFriendClick = (friend: FriendLocation) => {
    setSelectedFriend(friend);
  };

  const handleCloseDetails = () => {
    setSelectedFriend(null);
  };

  const handleViewProfile = () => {
    if (selectedFriend) {
      setShowProfile(selectedFriend.id);
      setSelectedFriend(null);
    }
  };

  const handleStartChat = () => {
    if (selectedFriend) {
      setShowChat(selectedFriend.id);
      setSelectedFriend(null);
    }
  };

  const handleSaveBitmoji = (avatarData: string) => {
    setUserBitmoji(avatarData);
    localStorage.setItem('userBitmoji', avatarData);
  };


  return (
    <>
      {/* Main Google Maps Component with Real-time Reader Locations */}
      <ModernGoogleMap />
      
      {/* Avatar Customization */}
      <Card className="bg-white shadow-sm border-0 rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Your Reading Avatar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200">
                {userBitmoji ? (
                  <img src={userBitmoji} alt="Your avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                    <User className="w-8 h-8 text-orange-600" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Customize Your Avatar</h3>
                <p className="text-sm text-gray-600">Create a unique reading persona</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowBitmojiCreator(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Palette className="w-4 h-4 mr-2" />
              {userBitmoji ? 'Edit Avatar' : 'Create Avatar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Friend Details Modal */}
      {selectedFriend && (
        <Dialog open={!!selectedFriend} onOpenChange={handleCloseDetails}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">Friend Details</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <Avatar className="w-16 h-16 mx-auto">
                <AvatarImage src={selectedFriend.avatar} />
                <AvatarFallback className="text-lg bg-orange-100 text-orange-700">
                  {getInitials(selectedFriend.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-gray-900">{selectedFriend.name}</h3>
                <p className="text-sm text-gray-600">Currently reading nearby</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={handleViewProfile}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleStartChat}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showProfile && (
        <UserProfileModal
          userId={showProfile}
          isOpen={!!showProfile}
          onClose={() => setShowProfile(null)}
        />
      )}

      {showChat && (
        <ChatWindow
          friendId={showChat}
          isOpen={!!showChat}
          onClose={() => setShowChat(null)}
        />
      )}

      {/* Bitmoji Creator */}
      <BitmojiCreator
        isOpen={showBitmojiCreator}
        onClose={() => setShowBitmojiCreator(false)}
        onSave={handleSaveBitmoji}
        currentAvatar={userBitmoji || undefined}
      />
    </>
  );
};
