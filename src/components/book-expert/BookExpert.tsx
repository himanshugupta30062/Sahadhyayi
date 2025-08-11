import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookExpert } from '@/contexts/BookExpertContext';
import { cn } from '@/lib/utils';

const BookExpert = () => {
  const { isOpen, toggleChat, closeChat, messages, sendMessage } = useBookExpert();
  const [input, setInput] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const colors = ['from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-pink-500 to-rose-600'];

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex(prev => (prev + 1) % colors.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className={`relative group flex items-center justify-center bg-gradient-to-r ${colors[colorIndex]} text-white shadow-2xl hover:shadow-xl transition-all duration-500 hover:scale-105 w-16 h-16 overflow-hidden [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0%_50%)]`}
          aria-label="Open Book Expert"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
          <div className="relative flex items-center justify-center">
            <img 
              src="/lovable-uploads/b87b26d6-95c0-43ce-b6b8-40102e1a9b09.png" 
              alt="AI Book Expert" 
              className="h-8 w-8 filter invert brightness-0" 
            />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-xl border-2 border-white/20 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Book-like header with changing colors */}
      <div className={`relative flex items-center justify-between bg-gradient-to-r ${colors[colorIndex]} p-4 text-white transition-all duration-1000`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/40 rounded-full"></div>
        <div className="relative flex items-center gap-2">
          <img 
            src="/lovable-uploads/b87b26d6-95c0-43ce-b6b8-40102e1a9b09.png" 
            alt="AI Book Expert" 
            className="h-6 w-6 filter invert brightness-0" 
          />
          <span className="font-bold text-lg">AI Book Expert</span>
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        <button onClick={closeChat} aria-label="Close chat" className="relative p-1 hover:bg-white/20 rounded transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm bg-gradient-to-b from-background to-background/90">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] rounded-xl px-4 py-3 shadow-md',
              m.sender === 'user'
                ? `ml-auto bg-gradient-to-r ${colors[colorIndex]} text-white`
                : 'bg-white/90 text-gray-800 border border-gray-200'
            )}
          >
            <div className="text-sm leading-relaxed">{m.text}</div>
            {m.sender === 'bot' && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Sparkles className="h-3 w-3" />
                <span>Powered by Gemini AI</span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200/50 bg-white/50 backdrop-blur p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about books..."
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
          />
          <Button 
            size="sm" 
            onClick={handleSend}
            className={`rounded-xl bg-gradient-to-r ${colors[colorIndex]} text-white px-4 py-3 hover:shadow-lg transition-all duration-300 hover:scale-105`}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookExpert;
