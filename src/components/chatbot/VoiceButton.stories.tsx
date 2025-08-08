import type { Meta, StoryObj } from '@storybook/react';
import VoiceButton from './VoiceButton';

const meta: Meta<typeof VoiceButton> = {
  component: VoiceButton,
  args: {
    isRecording: false,
    onToggle: () => {}
  }
};
export default meta;

export const Default: StoryObj<typeof VoiceButton> = {};
