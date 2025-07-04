
import { useEffect, useRef, useState } from 'react';
import { BookOpen, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useChatbot } from '@/contexts/ChatbotContext';
import { cn } from '@/lib/utils';

const Chatbot = () => {
  const { isOpen, toggleChat, closeChat, messages, sendMessage } = useChatbot();
  const [input, setInput] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [floating, setFloating] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const colorClasses = [
    'bg-gradient-to-r from-red-500 via-pink-500 to-purple-500',
    'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
    'bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500',
    'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500',
    'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500',
    'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500',
    'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500',
    'bg-gradient-to-r from-amber-600 via-lime-600 to-green-600',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const colorInterval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colorClasses.length);
    }, 5000);

    const stopTimeout = setTimeout(() => {
      clearInterval(colorInterval);
      setFloating(false);
    }, 60000); // stop after 1 minute

    return () => {
      clearInterval(colorInterval);
      clearTimeout(stopTimeout);
    };
  }, [colorClasses.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) {
    const button = (
      <button
        id="chatbot-icon"
        onClick={toggleChat}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-full text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-700',
          floating
            ? `animate-pulse ${colorClasses[colorIndex]}`
            : 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-amber-500 hover:to-orange-600'
        )}
        style={{ width: '56px', height: '56px', bottom: '24px', right: '24px' }}
        aria-label="Open chat with Book Expert"
      >
        <BookOpen className="h-6 w-6" />
      </button>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-medium">Book Expert AI</p>
          <p className="text-xs text-gray-500">Ask me about books!</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl transition-all duration-300",
      isMinimized ? "h-14 w-80" : "h-96 w-80 sm:w-96"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-amber-600 to-orange-600 p-3 text-white">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-white/20 rounded-full">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-sm">Book Expert</span>
            <div className="text-xs opacity-80">AI Literary Assistant</div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            aria-label="Minimize chat" 
            className="p-1 text-white hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button 
            onClick={closeChat} 
            aria-label="Close chat" 
            className="p-1 text-white hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={cn(
                'flex items-end gap-2 animate-in slide-in-from-bottom-2',
                m.sender === 'user' && 'justify-end'
              )}>
                {m.sender === 'bot' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm">
                    <BookOpen className="h-3 w-3" />
                  </div>
                )}
                <div className="max-w-[85%] space-y-1">
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 shadow-sm whitespace-pre-wrap',
                      m.sender === 'user'
                        ? 'ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    )}
                  >
                    {m.text}
                  </div>
                  {m.timestamp && (
                    <div className={cn(
                      'text-xs text-gray-400 px-1',
                      m.sender === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {formatTime(m.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white p-2">
            <div className="flex items-center gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about books, authors, reading tips..."
                className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '36px', maxHeight: '72px' }}
              />
              <Button 
                size="sm" 
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-400 mt-1 px-1">
              Press Enter to send, Shift + Enter for new line
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
