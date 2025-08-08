import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import Loader from './Loader';
import { Message } from '@/hooks/chatbot/useChatHistory';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
  isProcessing: boolean;
}

export function ChatMessages({ messages, isLoading, isRecording, isProcessing }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isRecording, isProcessing]);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);

  return (
    <div
      id="chat-panel"
      role="region"
      aria-live="polite"
      aria-busy={isLoading || isRecording || isProcessing}
      className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3 text-sm min-h-0"
    >
      {messages.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-600 mb-2">Welcome to Book Expert!</p>
          <p className="text-xs text-gray-500">Ask me about books, authors, or features!</p>
        </div>
      )}

      {messages.map((m, i) => (
        <div key={i} className={cn('flex items-end gap-2 animate-in slide-in-from-bottom-2', m.sender === 'user' && 'justify-end')}>
          {m.sender === 'bot' && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm flex-shrink-0">
              <BookOpen className="h-3 w-3" />
            </div>
          )}
          <div className="max-w-[85%] space-y-1">
            <div
              className={cn(
                'rounded-lg px-3 py-2 shadow-sm whitespace-pre-wrap break-words',
                m.sender === 'user'
                  ? 'ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              )}
            >
              {m.text}
            </div>
            {m.books && m.books.length > 0 && (
              <div className="mt-1 flex flex-col space-y-1">
                {m.books.map((book) => (
                  <Link key={book.id} to={`/book/${book.id}`} className="text-amber-600 underline text-sm hover:text-amber-700">
                    {book.title}
                  </Link>
                ))}
              </div>
            )}
            {m.timestamp && (
              <div className={cn('text-xs text-gray-400 px-1', m.sender === 'user' ? 'text-right' : 'text-left')}>
                {formatTime(m.timestamp)}
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && <Loader />}
      {(isRecording || isProcessing) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className={cn('w-3 h-3 rounded-full', isRecording ? 'bg-red-500 animate-pulse' : 'bg-amber-500')} />
          <span className="text-sm text-amber-700">{isRecording ? 'Listening...' : 'Processing...'}</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;
