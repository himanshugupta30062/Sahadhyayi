import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatWindow } from '@/components/chatbot/presentational/ChatWindow';

describe('ChatWindow', () => {
  afterEach(() => cleanup());

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ChatWindow
        isOpen={false}
        onToggle={vi.fn()}
        gradientClass="bg-gradient-to-r from-blue-500 to-indigo-500"
      >
        <div>Chat Body</div>
      </ChatWindow>
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Chat Body')).not.toBeInTheDocument();
  });

  it('renders chat window with children and aria tags when isOpen is true', () => {
    render(
      <ChatWindow
        isOpen={true}
        onToggle={vi.fn()}
        gradientClass="bg-gradient-to-r from-blue-500 to-indigo-500"
        loading={true}
      >
        <div>Chat Body</div>
      </ChatWindow>
    );

    expect(screen.getByRole('complementary', { name: 'Chat window' })).toBeInTheDocument();
    expect(screen.getByText('Chat Body')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
  });
});
