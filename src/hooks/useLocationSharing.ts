import * as React from 'react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLocationSharing = () => {
  const [isSharing, setIsSharing] = useState(false);
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

      // Check if user already has location shared for this book
      const { data: existingLocation } = await supabase
        .from('user_books_location')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (existingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('user_books_location')
          .update({
            latitude,
            longitude,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLocation.id);

        if (error) throw error;
        toast.success('Location updated for this book!');
      } else {
        // Insert new location
        const { error } = await supabase
          .from('user_books_location')
          .insert({
            user_id: user.id,
            book_id: bookId,
            latitude,
            longitude
          });

        if (error) throw error;
        toast.success('Location shared for this book!');
      }

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