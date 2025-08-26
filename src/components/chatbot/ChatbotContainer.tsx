import React, { useEffect, useState } from 'react';
import { ChatWindow } from './presentational/ChatWindow';
import { ChatHeader } from './presentational/ChatHeader';
import { ChatMessages } from './presentational/ChatMessages';
import { ChatInput } from './presentational/ChatInput';
import { VoiceButton } from './presentational/VoiceButton';
import { Loader } from './presentational/Loader';

import { useColorCycle } from '@/hooks/chatbot/useColorCycle';
import { useChatHistory } from '@/hooks/chatbot/useChatHistory';
import { useChatbotAI } from '@/hooks/chatbot/useChatbotAI';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { generateContextualResponse } from '@/utils/chatbotKnowledge';

const GRADIENTS = [
  'bg-gradient-to-r from-emerald-500 to-blue-500',
  'bg-gradient-to-r from-indigo-500 to-purple-500',
  'bg-gradient-to-r from-pink-500 to-rose-500'
];

export default function ChatbotContainer() {
  const gradientClass = useColorCycle(GRADIENTS, 10000);
  const { isOpen, toggleOpen, messages, append, input, setInputText, consumeInput } = useChatHistory(false);
  const { ask, initializeWebsiteKnowledge } = useChatbotAI();
  const [loading, setLoading] = useState(false);

  useEffect(() => { initializeWebsiteKnowledge?.(); }, [initializeWebsiteKnowledge]);

  const onSend = async () => {
    const text = consumeInput();
    if (!text) return;
    setLoading(true);
    try {
      const reply = await ask(text);
      append('assistant', reply);
    } catch (e: any) {
      console.error(e);
      const fallback = generateContextualResponse(text);
      append('assistant', fallback);
    } finally {
      setLoading(false);
    }
  };

  const { isRecording, toggleRecording } = useSpeechToText({
    onTranscript: (t) => setInputText((input ? input + ' ' : '') + t),
    onError: (err) => append('system', `Mic error: ${err}`),
  }) as any;

  return (
    <ChatWindow isOpen={isOpen} onToggle={toggleOpen} gradientClass={gradientClass} loading={loading}>
      <ChatHeader title="Sahadhyayi Assistant" subtitle="Ask about books, genres & summaries" />
      <ChatMessages messages={messages} />
      {loading && <Loader />}
      <ChatInput
        value={input}
        onChange={setInputText}
        onSend={onSend}
        disabled={loading}
        rightSlot={<VoiceButton isRecording={!!isRecording} onToggle={toggleRecording} />}
      />
    </ChatWindow>
  );
}
