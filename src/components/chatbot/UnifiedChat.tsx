import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { ask as askGeneral } from '@/ai/service';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useColorCycle } from '@/hooks/chatbot/useColorCycle';
import { VoiceButton } from './presentational/VoiceButton';

const BOOK_GRADIENTS = [
  'bg-gradient-to-r from-violet-500 to-purple-600',
  'bg-gradient-to-r from-blue-500 to-cyan-600',
  'bg-gradient-to-r from-emerald-500 to-teal-600',
];

const CHAT_GRADIENTS = [
  'bg-gradient-to-r from-emerald-500 to-blue-500',
  'bg-gradient-to-r from-indigo-500 to-purple-500',
  'bg-gradient-to-r from-pink-500 to-rose-500',
];

type Mode = 'book' | 'chat';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  mode: Mode;
}

export default function UnifiedChat() {
  const [mode, setMode] = useState<Mode>('book');
  const gradientClass = useColorCycle(mode === 'book' ? BOOK_GRADIENTS : CHAT_GRADIENTS, 5000);
  const [isOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const addMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    addMessage({ sender: 'user', text, mode });
    setInput('');
    setLoading(true);
    try {
      let reply = '';
      if (mode === 'book') {
        const { data, error } = await supabase.functions.invoke('book-expert-gemini', { body: { text } });
        if (error) throw error;
        reply = data?.reply ?? 'Sorry, I could not process your request at the moment.';
      } else {
        const result = await askGeneral(text);
        reply = result?.reply ?? '';
      }
      addMessage({ sender: 'ai', text: reply, mode });
    } catch (err) {
      console.error(err);
      addMessage({ sender: 'ai', text: 'Sorry—something went wrong. Please try again.', mode });
    } finally {
      setLoading(false);
    }
  };

  const { isRecording, toggleRecording } = useSpeechToText({
    onTranscript: t => setInput(prev => (prev ? prev + ' ' : '') + t),
    onError: err => addMessage({ sender: 'ai', text: `Mic error: ${err}`, mode }),
  }) as any;

  return (
    <>
      {isOpen && (
        <aside className="fixed bottom-16 right-4 left-4 sm:left-auto sm:right-6 z-50 w-auto sm:w-[360px] max-h-[70vh] rounded-xl shadow-lg overflow-hidden flex flex-col bg-background">
          <div className={`p-2 text-white flex justify-between items-center ${gradientClass}`}>
            <span>{mode === 'book' ? 'Book Expert' : 'Chatbot'}</span>
            <button
              onClick={() => setMode(mode === 'book' ? 'chat' : 'book')}
              className="text-xs underline"
            >
              {mode === 'book' ? 'Chatbot Mode' : 'Book Expert Mode'}
            </button>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto bg-background">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                    m.sender === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {m.text}
                </div>
                {m.sender === 'ai' && m.mode === 'book' && (
                  <span className="text-[10px] mt-1 text-gray-300">Powered by Gemini AI</span>
                )}
              </div>
            ))}
            {loading && <div className="text-xs text-muted-foreground">Thinking…</div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t flex items-center gap-2 bg-background">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message…"
              className="flex-1 rounded border px-2 py-1 text-sm"
              disabled={loading}
            />
            <VoiceButton isRecording={!!isRecording} onToggle={toggleRecording} />
            <button
              onClick={handleSend}
              disabled={loading}
              className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm"
            >
              Send
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

