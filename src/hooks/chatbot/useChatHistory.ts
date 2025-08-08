import { useCallback, useState } from 'react';
import { nanoid } from 'nanoid';
import type { ChatMsg } from '@/components/chatbot/presentational/ChatMessages';

export function useChatHistory(initialOpen = false) {
  const [isOpen, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');

  const toggleOpen = useCallback(() => setOpen(v => !v), []);
  const append = useCallback((role: ChatMsg['role'], content: string) => {
    setMessages(m => [...m, { id: nanoid(), role, content }]);
  }, []);
  const clear = useCallback(() => setMessages([]), []);
  const setInputText = useCallback((v: string) => setInput(v), []);
  const consumeInput = useCallback(() => {
    const v = input.trim();
    if (v) append('user', v);
    setInput('');
    return v;
  }, [input, append]);

  return { isOpen, toggleOpen, messages, append, clear, input, setInputText, consumeInput };
}
