import { useState } from 'react';

export interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
  books?: { id: string; title: string }[];
}

export function useChatHistory(initialOpen: boolean) {
  const [isOpen, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleOpen = () => setOpen((o) => !o);
  const sendMessage = (message: Message) =>
    setMessages((msgs) => [...msgs, { ...message, timestamp: new Date() }]);

  return { isOpen, messages, toggleOpen, sendMessage };
}

