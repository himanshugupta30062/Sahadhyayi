import * as React from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';

export const useLocationSharing = () => {
  const [isSharing, setIsSharing] = React.useState(false);
  const { user } = useAuth();

  const shareLocationForBook = async (bookId: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to share your location');
      return false;
    }

    setIsSharing(true);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Use the new secure function that validates consent
      const { data: locationId, error } = await supabase.rpc('share_book_location', {
        book_uuid: bookId,
        lat: latitude,
        lng: longitude
      });

      if (error) {
        if (error.message.includes('consent required')) {
          toast.error('Location sharing consent required. Please enable location sharing in your settings.');
        } else {
          toast.error(`Failed to share location: ${error.message}`);
        }
        return false;
      }

      toast.success('Location shared securely with friends!');
      return true;
    } catch (error: any) {
      console.error('Error sharing location:', error);
      
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location services.');
      } else if (error.code === 2) {
        toast.error('Location unavailable. Please try again.');
      } else if (error.code === 3) {
        toast.error('Location request timed out. Please try again.');
      } else {
        toast.error('Failed to share location. Please try again.');
      }
      
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  const removeLocationForBook = async (bookId: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_books_location')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId);

      if (error) throw error;
      toast.success('Location sharing stopped for this book');
      return true;
    } catch (error) {
      console.error('Error removing location:', error);
      toast.error('Failed to remove location sharing');
      return false;
    }
  };

  return {
    shareLocationForBook,
    removeLocationForBook,
    isSharing
  };
};