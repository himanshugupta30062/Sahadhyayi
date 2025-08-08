import type { Meta, StoryObj } from '@storybook/react';
import ChatInput from './ChatInput';

const meta: Meta<typeof ChatInput> = {
  component: ChatInput,
  args: {
    value: '',
    onChange: () => {},
    onSend: () => {},
    onToggleRecording: () => {},
    isRecording: false,
    isProcessing: false,
    isLoading: false
  }
};
export default meta;

export const Default: StoryObj<typeof ChatInput> = {};
