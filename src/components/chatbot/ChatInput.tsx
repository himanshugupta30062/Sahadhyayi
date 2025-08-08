import React from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import VoiceButton from './VoiceButton';

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onToggleRecording: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  isLoading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onToggleRecording,
  isRecording,
  isProcessing,
  isLoading,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t bg-white p-3 flex-shrink-0">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about books, authors, or platform features!"
          className="w-full resize-none rounded-lg border border-gray-300 pl-4 pr-20 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={1}
          disabled={isLoading || isRecording || isProcessing}
          style={{ minHeight: '48px', maxHeight: '96px' }}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <VoiceButton
            isRecording={isRecording}
            onToggle={onToggleRecording}
            disabled={isLoading || isProcessing}
          />
          <Button
            size="sm"
            onClick={onSend}
            disabled={!value.trim() || isLoading || isRecording || isProcessing}
            className="h-8 w-8 p-0 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2 px-1">Short &amp; precise responses</div>
    </div>
  );
}

export default ChatInput;
