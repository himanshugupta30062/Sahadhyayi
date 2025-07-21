
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';

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
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Permission Required
          </DialogTitle>
          <DialogDescription>
            {hasError ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Location Access Failed</span>
                </div>
                <p className="text-gray-600">{errorMessage}</p>
                <p className="text-sm text-gray-500">
                  Please check your browser settings and try again, or manually enable location sharing for this site.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p>
                  To show you nearby readers and connect you with your friends, we need access to your location.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">What we'll do with your location:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Show readers near you who are reading the same books</li>
                    <li>• Display your friends' locations on the map</li>
                    <li>• Help you discover reading communities nearby</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">
                  Your location is only shared with friends and is never stored permanently.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onRequestLocation} 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {hasError ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Allow Location
              </>
            )}
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
