
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SessionTimeoutWarningProps {
  onExtendSession: () => void;
  timeRemaining: number;
  isVisible: boolean;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  onExtendSession,
  timeRemaining,
  isVisible
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);
  const { signOut } = useAuth();

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isVisible || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Session Timeout Warning</span>
            </div>
            <p className="mt-2">
              Your session will expire in <span className="font-bold text-red-600">{formatTime(countdown)}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              You will be automatically logged out due to inactivity.
            </p>
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800"
          >
            Logout Now
          </Button>
          <Button
            onClick={onExtendSession}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Stay Logged In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
