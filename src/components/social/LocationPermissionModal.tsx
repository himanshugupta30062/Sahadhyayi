
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  hasError?: boolean;
  errorMessage?: string;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onRequestLocation,
  hasError = false,
  errorMessage
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError ? (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            ) : (
              <MapPin className="w-5 h-5 text-blue-600" />
            )}
            Location Access Required
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            {hasError ? (
              <div className="space-y-3">
                <p className="text-red-600 font-medium">{errorMessage}</p>
                <p className="text-sm text-gray-600">
                  We need your location to show readers near you. Please enable location access in your browser settings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-700">
                  To show you nearby readers and personalize your experience, we need access to your location.
                </p>
                <p className="text-sm text-gray-500">
                  Your location data is only used to find readers near you and is not stored permanently.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {hasError ? 'Close' : 'Not Now'}
          </Button>
          {!hasError && (
            <Button
              onClick={onRequestLocation}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Allow Location
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
