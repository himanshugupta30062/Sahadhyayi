import type { Meta, StoryObj } from '@storybook/react';
import ChatHeader from './ChatHeader';

const meta: Meta<typeof ChatHeader> = {
  component: ChatHeader,
  args: {
    trainingDataCount: 5,
    onRefresh: () => {},
    onExport: () => {},
    onMinimize: () => {},
    onClose: () => {}
  }
};
export default meta;

export const Default: StoryObj<typeof ChatHeader> = {};
