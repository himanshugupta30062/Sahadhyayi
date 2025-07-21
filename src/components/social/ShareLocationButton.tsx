import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Share2, Loader2 } from 'lucide-react';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { cn } from '@/lib/utils';

interface ShareLocationButtonProps {
  bookId: string;
  isShared?: boolean;
  onLocationShared?: () => void;
  className?: string;
}

export const ShareLocationButton: React.FC<ShareLocationButtonProps> = ({
  bookId,
  isShared = false,
  onLocationShared,
  className
}) => {
  const { shareLocationForBook, removeLocationForBook, isSharing } = useLocationSharing();
  const [isCurrentlyShared, setIsCurrentlyShared] = useState(isShared);

  const handleLocationShare = async () => {
    if (isCurrentlyShared) {
      const success = await removeLocationForBook(bookId);
      if (success) {
        setIsCurrentlyShared(false);
        onLocationShared?.();
      }
    } else {
      const success = await shareLocationForBook(bookId);
      if (success) {
        setIsCurrentlyShared(true);
        onLocationShared?.();
      }
    }
  };

  return (
    <Button
      onClick={handleLocationShare}
      disabled={isSharing}
      variant={isCurrentlyShared ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-2 transition-all duration-200",
        isCurrentlyShared 
          ? "bg-green-600 hover:bg-green-700 text-white" 
          : "border-orange-300 text-orange-700 hover:bg-orange-50",
        className
      )}
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {isCurrentlyShared ? (
            <MapPin className="w-4 h-4 fill-current" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </>
      )}
      {isSharing 
        ? "Updating..." 
        : isCurrentlyShared 
          ? "Location Shared" 
          : "Share Location"
      }
    </Button>
  );
};