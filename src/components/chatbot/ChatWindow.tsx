import React from 'react';
import { BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  children: React.ReactNode;
}

export function ChatWindow({ color, isOpen, onToggle, isMinimized, children }: ChatWindowProps) {
  if (!isOpen) {
    const button = (
      <button
        id="chatbot-icon"
        onClick={onToggle}
        className={cn(
          'fixed z-[9999] flex items-center justify-center rounded-full text-white cursor-pointer shadow-2xl hover:shadow-xl transition-all duration-700 border-2 border-white/30',
          color
        )}
        style={{
          width: '64px',
          height: '64px',
          bottom: '24px',
          right: '24px',
          transition: 'background 1s ease-in-out, transform 0.2s ease-out',
          transform: 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Open chat with Book Expert"
        aria-expanded={isOpen}
        aria-controls="chat-panel"
      >
        <BookOpen className="h-7 w-7" />
      </button>
    );

    return (
      <aside aria-label="Chat window" role="complementary">
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Book Expert AI</p>
            <p className="text-xs text-gray-500">Enhanced with website knowledge!</p>
          </TooltipContent>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside aria-label="Chat window" role="complementary">
      <div
        className={cn(
          'fixed bottom-4 right-4 z-[9999] flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl transition-all duration-300',
          isMinimized ? 'h-14 w-80' : 'h-[36rem] w-80 sm:w-96'
        )}
      >
        {children}
      </div>
    </aside>
  );
}

export default ChatWindow;
