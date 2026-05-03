
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Palette } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { ChatWindow } from './ChatWindow';
import { ReadersNearMeMap } from './ReadersNearMeMap';
import { BitmojiCreator } from './BitmojiCreator';
import { useUserAvatar } from '@/hooks/useUserAvatar';

export const EnhancedReadingMap = () => {
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [showBitmojiCreator, setShowBitmojiCreator] = useState(false);
  
  const { data: userAvatar } = useUserAvatar();

  const handleSaveBitmoji = (avatarData: string) => {
    // This will be handled by the BitmojiCreator component
  };

  return (
    <>
      {/* Main Readers Near Me Map */}
      <ReadersNearMeMap />
      
      {/* Avatar Customization */}
      <Card className="bg-card border-border rounded-2xl mt-6 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-brand-primary" />
            </div>
            Your Reading Avatar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-brand-primary/20 bg-gradient-button">
                {userAvatar?.avatar_img_url ? (
                  <img src={userAvatar.avatar_img_url} alt="Your avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Customize Your Avatar</h3>
                <p className="text-sm text-muted-foreground">Create a unique reading persona</p>
              </div>
            </div>
            <Button
              onClick={() => setShowBitmojiCreator(true)}
              className="bg-gradient-button text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-elevated)] hover:opacity-95 rounded-xl"
            >
              <Palette className="w-4 h-4 mr-2" />
              {userAvatar ? 'Edit Avatar' : 'Create Avatar'}
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
        currentAvatar={userAvatar?.avatar_img_url || undefined}
      />
    </>
  );
}
