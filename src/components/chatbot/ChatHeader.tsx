import React from 'react';
import { BookOpen, Download, Minimize2, RefreshCw, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHeaderProps {
  trainingDataCount: number;
  onRefresh: () => void;
  onExport: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function ChatHeader({ trainingDataCount, onRefresh, onExport, onMinimize, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-gradient-to-r from-amber-600 to-orange-600 p-3 text-white flex-shrink-0">
      <div className="flex items-center space-x-2">
        <div className="p-1 bg-white/20 rounded-full">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-sm">Book Expert AI</span>
          <div className="text-xs opacity-80">{trainingDataCount} training samples loaded</div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onRefresh} className="p-1 text-white hover:bg-white/20 rounded transition-colors" aria-label="Refresh knowledge">
              <RefreshCw className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh Knowledge</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onExport} className="p-1 text-white hover:bg-white/20 rounded transition-colors" aria-label="Export training data">
              <Download className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export Training Data ({trainingDataCount})</p>
          </TooltipContent>
        </Tooltip>
        <button onClick={onMinimize} className="p-1 text-white hover:bg-white/20 rounded transition-colors" aria-label="Minimize chat">
          <Minimize2 className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="p-1 text-white hover:bg-white/20 rounded transition-colors" aria-label="Close chat">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
