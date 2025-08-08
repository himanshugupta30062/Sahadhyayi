import type { Meta, StoryObj } from '@storybook/react';
import ChatMessages from './ChatMessages';
import type { Message } from '@/hooks/chatbot/useChatHistory';

const messages: Message[] = [
  { sender: 'bot', text: 'Hello!', timestamp: new Date() },
  { sender: 'user', text: 'Hi', timestamp: new Date() }
];

const meta: Meta<typeof ChatMessages> = {
  component: ChatMessages,
  args: {
    messages,
    isLoading: false,
    isRecording: false,
    isProcessing: false
  }
};
export default meta;

export const Default: StoryObj<typeof ChatMessages> = {};
