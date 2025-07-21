
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Palette } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { ChatWindow } from './ChatWindow';
import { ReadersNearMeMap } from './ReadersNearMeMap';
import { BitmojiCreator } from './BitmojiCreator';

export const EnhancedReadingMap = () => {
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [showBitmojiCreator, setShowBitmojiCreator] = useState(false);
  const [userBitmoji, setUserBitmoji] = useState<string | null>(
    localStorage.getItem('userBitmoji')
  );

  const handleSaveBitmoji = (avatarData: string) => {
    setUserBitmoji(avatarData);
    localStorage.setItem('userBitmoji', avatarData);
  };

  return (
    <>
      {/* Main Readers Near Me Map */}
      <ReadersNearMeMap />
      
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
