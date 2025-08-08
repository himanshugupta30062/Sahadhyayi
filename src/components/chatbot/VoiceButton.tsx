import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VoiceButton({ isRecording, onToggle, disabled }: VoiceButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0 transition-colors',
        isRecording
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
      )}
    >
      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}

export default VoiceButton;
