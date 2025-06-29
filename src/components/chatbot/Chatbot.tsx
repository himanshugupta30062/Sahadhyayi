
import { useEffect, useRef, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatbot } from '@/contexts/ChatbotContext';
import { cn } from '@/lib/utils';

const Chatbot = () => {
  const { isOpen, toggleChat, closeChat, messages, sendMessage } = useChatbot();
  const [input, setInput] = useState('');
  const [floating, setFloating] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setFloating(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        id="chatbot-icon"
        onClick={toggleChat}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-full bg-black text-white cursor-pointer',
          floating && 'animate-float'
        )}
        style={{ width: '50px', height: '50px', bottom: '30px', right: '30px' }}
        aria-label="Open chat with Book Expert"
      >
        <BookOpen className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl dark:border-gray-700">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-gray-800 to-gray-900 p-3 text-white">
        <span className="font-semibold">Book Expert</span>
        <button onClick={closeChat} aria-label="Close chat" className="p-1 text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-white p-3 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex items-end gap-2', m.sender === 'user' && 'justify-end')}>
            {m.sender === 'bot' && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow animate-pulse">
                <BookOpen className="h-3 w-3" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 shadow',
                m.sender === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {m.text}
            </div>
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
            placeholder="Ask about books, reading, or literature..."
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
          />
          <Button size="sm" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
