import type { Meta, StoryObj } from '@storybook/react';
import BookCard from './BookCard';
import type { Book } from '@/hooks/useLibraryBooks';

const meta: Meta<typeof BookCard> = {
  component: BookCard,
  args: {
    book: {
      id: '1',
      title: 'Example Book',
      author: 'Author Name',
      created_at: new Date().toISOString()
    } as Book,
    onDownloadPDF: () => {}
  }
};
export default meta;

export const Default: StoryObj<typeof BookCard> = {};
