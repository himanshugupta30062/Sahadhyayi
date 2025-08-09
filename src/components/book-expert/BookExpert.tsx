import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookExpert } from '@/contexts/BookExpertContext';
import { cn } from '@/lib/utils';

const BookExpert = () => {
  const { isOpen, toggleChat, closeChat, messages, sendMessage } = useBookExpert();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

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
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground shadow-lg hover-scale"
        aria-label="Open Book Expert"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary via-secondary to-accent p-3 text-primary-foreground">
        <span className="font-semibold">Book Expert</span>
        <button onClick={closeChat} aria-label="Close chat" className="p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[80%] rounded-lg px-3 py-2',
              m.sender === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about books..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button size="sm" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookExpert;
