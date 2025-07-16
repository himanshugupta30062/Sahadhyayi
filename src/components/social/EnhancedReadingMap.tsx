
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, MessageCircle, User, Users } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { UserProfileModal } from './UserProfileModal';
import { ChatWindow } from './ChatWindow';
import { ReadingMap } from './ReadingMap';

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
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  const [zoom, setZoom] = useState(10);

  const { data: friends = [] } = useFriends();

  // Filter friends who have shared their location
  const friendsWithLocation = friends.filter(friend => 
    friend.friend_profile?.location_sharing && 
    friend.friend_profile?.location_lat && 
    friend.friend_profile?.location_lng
  ).map(friend => ({
    id: friend.friend_profile?.id || '',
    name: friend.friend_profile?.full_name || '',
    avatar: friend.friend_profile?.profile_photo_url,
    lat: friend.friend_profile?.location_lat || 0,
    lng: friend.friend_profile?.location_lng || 0,
    lastSeen: friend.friend_profile?.last_seen || ''
  }));

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

  return (
    <>
      {/* Enhanced Reading Map showing readers of same books */}
      <ReadingMap />
      
      {/* Original Friends Location Map */}
      <Card className="bg-white shadow-sm border-0 rounded-xl mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Friends Near Me
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Map Container */}
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-80 border overflow-hidden">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-gradient-to-br from-green-200 via-blue-200 to-purple-200"></div>
            </div>
            
            {/* Friends Markers */}
            {friendsWithLocation.map((friend, index) => (
              <div
                key={friend.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                style={{
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${20 + (index * 20) % 50}%`
                }}
                onClick={() => handleFriendClick(friend)}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback className="text-sm bg-orange-100 text-orange-700">
                      {getInitials(friend.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </div>
            ))}

            {/* Current User Location */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: '50%', top: '50%' }}
            >
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-blue-600 rounded-full animate-ping opacity-25"></div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="w-8 h-8 p-0 bg-white"
                onClick={() => setZoom(Math.min(zoom + 1, 18))}
              >
                +
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-8 h-8 p-0 bg-white"
                onClick={() => setZoom(Math.max(zoom - 1, 1))}
              >
                -
              </Button>
            </div>
          </div>

          {/* Friends List */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Friends on Map ({friendsWithLocation.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {friendsWithLocation.length > 0 ? (
                friendsWithLocation.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleFriendClick(friend)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback className="text-sm bg-green-100 text-green-700">
                          {getInitials(friend.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                        <p className="text-xs text-gray-500">Online</p>
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No friends sharing location</p>
                </div>
              )}
            </div>
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
    </>
  );
};
