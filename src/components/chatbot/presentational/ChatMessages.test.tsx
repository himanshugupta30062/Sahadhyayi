import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { ChatMessages, type ChatMsg } from '@/components/chatbot/presentational/ChatMessages';

describe('ChatMessages', () => {
  afterEach(() => cleanup());

  it('renders messages with user and bot distinction', () => {
    const messages: ChatMsg[] = [
      { id: '1', role: 'user', content: 'Hello there' },
      { id: '2', role: 'assistant', content: 'How can I assist you with books?' },
    ];

    render(<ChatMessages messages={messages} />);

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('How can I assist you with books?')).toBeInTheDocument();
  });
});
