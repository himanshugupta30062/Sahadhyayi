import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, MapPin, Users, Eye, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';

interface LocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGiven: () => void;
}

export const LocationConsentModal: React.FC<LocationConsentModalProps> = ({
  isOpen,
  onClose,
  onConsentGiven
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleGiveConsent = async () => {
    setIsSubmitting(true);
    try {
      // Record explicit consent with metadata
      const { error } = await supabase.rpc('record_location_consent', {
        ip_addr: null, // IP will be captured server-side if needed
        user_agent_string: navigator.userAgent
      });

      if (error) {
        console.error('Error recording consent:', error);
        toast({
          title: "Error",
          description: "Failed to record location sharing consent. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Location Sharing Enabled",
        description: "You can now share your location with friends who also have location sharing enabled.",
      });

      onConsentGiven();
      onClose();
    } catch (error) {
      console.error('Error in consent process:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Location Sharing Consent
          </DialogTitle>
          <DialogDescription>
            We need your explicit consent to enable location sharing features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your privacy is our priority. Your location data is protected by multiple security layers.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">What we collect</h4>
                <p className="text-sm text-muted-foreground">
                  Your approximate location when you're reading, to help you connect with nearby readers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Who can see it</h4>
                <p className="text-sm text-muted-foreground">
                  Only friends who you've connected with AND who also have location sharing enabled.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Your control</h4>
                <p className="text-sm text-muted-foreground">
                  You can disable location sharing anytime in your profile settings.
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              By clicking "Enable Location Sharing", you consent to the collection and processing of your location data as described in our Privacy Policy. This consent includes recording your IP address and browser information for security purposes.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Not Now
            </Button>
            <Button 
              onClick={handleGiveConsent}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Processing..." : "Enable Location Sharing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};