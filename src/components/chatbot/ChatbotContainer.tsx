import React, { useState } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { toast } from '@/hooks/use-toast';
import { useChatHistory } from '@/hooks/chatbot/useChatHistory';
import { useColorCycle } from '@/hooks/chatbot/useColorCycle';
import { useChatbotAI } from '@/hooks/chatbot/useChatbotAI';
import ChatWindow from './ChatWindow';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const GRADIENTS = [
  'bg-gradient-to-r from-red-500 via-pink-500 to-purple-500',
  'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
  'bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500',
  'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500',
  'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500',
  'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500',
  'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500',
  'bg-gradient-to-r from-amber-600 via-lime-600 to-green-600',
];

export default function ChatbotContainer() {
  const color = useColorCycle(GRADIENTS, 2000);
  const { isOpen, messages, toggleOpen, sendMessage } = useChatHistory(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trainingDataCount, setTrainingDataCount] = useState(0);

  const { queryAI, exportTrainingData, initializeWebsiteKnowledge } = useChatbotAI();

  const { isRecording, isProcessing, toggleRecording } = useSpeechToText({
    onTranscript: (text) => setInput(text),
    onError: (error) => console.error('Speech recognition error:', error),
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ sender: 'user', text: input });
    setInput('');
    setIsLoading(true);
    try {
      const ai = await queryAI(input);
      sendMessage({ sender: 'bot', text: ai.text, books: ai.books });
      setTrainingDataCount(ai.trainingDataCount);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshKnowledge = async () => {
    try {
      await initializeWebsiteKnowledge();
      toast({
        title: 'Knowledge Refreshed',
        description: 'Website knowledge has been updated',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error refreshing knowledge:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh knowledge base',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    try {
      await exportTrainingData();
      toast({
        title: 'Training Data Exported',
        description: `Successfully exported ${trainingDataCount} training samples`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export training data',
        variant: 'destructive',
      });
    }
  };

  return (
    <ChatWindow color={color} isOpen={isOpen} onToggle={toggleOpen} isMinimized={isMinimized}>
      <ChatHeader
        trainingDataCount={trainingDataCount}
        onRefresh={handleRefreshKnowledge}
        onExport={handleExportData}
        onMinimize={() => setIsMinimized(!isMinimized)}
        onClose={toggleOpen}
      />
      {!isMinimized && (
        <>
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isRecording={isRecording}
            isProcessing={isProcessing}
          />
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onToggleRecording={toggleRecording}
            isRecording={isRecording}
            isProcessing={isProcessing}
            isLoading={isLoading}
          />
        </>
      )}
    </ChatWindow>
  );
}
