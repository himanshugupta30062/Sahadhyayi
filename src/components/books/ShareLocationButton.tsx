import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, MapPinOff, Loader2 } from 'lucide-react';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

interface ShareLocationButtonProps {
  bookId: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export const ShareLocationButton = ({ 
  bookId, 
  variant = 'outline', 
  size = 'sm' 
}: ShareLocationButtonProps) => {
  const { user } = useAuth();
  const { shareLocationForBook, removeLocationForBook, isSharing } = useLocationSharing();
  const [hasSharedLocation, setHasSharedLocation] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLocationStatus = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has location sharing enabled using secure function
        const { data: hasLocationSharing } = await supabase.rpc('user_has_location_sharing');
        
        if (!hasLocationSharing) {
          setHasSharedLocation(false);
          return;
        }

        // For the UI state, we'll just check if they have location sharing enabled
        // The actual location data is now secured and only visible to friends
        setHasSharedLocation(hasLocationSharing);
      } catch (error) {
        console.error('Error checking location status:', error);
        setHasSharedLocation(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkLocationStatus();
  }, [user?.id, bookId]);

  const handleLocationToggle = async () => {
    if (hasSharedLocation) {
      const success = await removeLocationForBook(bookId);
      if (success) {
        setHasSharedLocation(false);
      }
    } else {
      const success = await shareLocationForBook(bookId);
      if (success) {
        setHasSharedLocation(true);
      }
    }
  };

  if (!user) {
    return null;
  }

  if (isChecking) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLocationToggle}
      disabled={isSharing}
      className="gap-2"
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hasSharedLocation ? (
        <MapPinOff className="h-4 w-4" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {hasSharedLocation ? 'Stop Sharing' : 'Share Location'}
    </Button>
  );
};