import { useState } from 'react';

import { ChatWindow } from '@/components/chatbot/presentational/ChatWindow';
import { ChatHeader } from '@/components/chatbot/presentational/ChatHeader';
import { ChatMessages, ChatMsg } from '@/components/chatbot/presentational/ChatMessages';
import { ChatInput } from '@/components/chatbot/presentational/ChatInput';
import { useBookExpert } from '@/contexts/BookExpertContext';
import { useColorCycle } from '@/hooks/chatbot/useColorCycle';

const GRADIENTS = [
  'bg-gradient-to-r from-violet-500 to-purple-600',
  'bg-gradient-to-r from-blue-500 to-cyan-600',
  'bg-gradient-to-r from-emerald-500 to-teal-600',
  'bg-gradient-to-r from-amber-500 to-orange-600',
  'bg-gradient-to-r from-pink-500 to-rose-600',
];

export default function BookExpert() {
  const { isOpen, toggleChat, messages, sendMessage } = useBookExpert();
  const [input, setInput] = useState('');
  const gradientClass = useColorCycle(GRADIENTS, 3000);

  const chatMessages: ChatMsg[] = messages.map((m, i) => ({
    id: String(i),
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <ChatWindow isOpen={isOpen} onToggle={toggleChat} gradientClass={gradientClass}>
      <ChatHeader title="Book Expert" subtitle="Ask me anything about books" />
      <ChatMessages messages={chatMessages} />
      <ChatInput value={input} onChange={setInput} onSend={handleSend} />
    </ChatWindow>
  );
}

