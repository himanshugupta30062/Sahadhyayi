import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatInput } from '@/components/chatbot/presentational/ChatInput';

describe('ChatInput', () => {
  afterEach(() => cleanup());

  it('handles typing, enter key submission, and send button click', () => {
    const onChange = vi.fn();
    const onSend = vi.fn();

    render(
      <ChatInput
        value="Tell me about Harry Potter"
        onChange={onChange}
        onSend={onSend}
      />
    );

    const input = screen.getByPlaceholderText('Ask about books…');
    expect(input).toHaveValue('Tell me about Harry Potter');

    fireEvent.change(input, { target: { value: 'New text' } });
    expect(onChange).toHaveBeenCalledWith('New text');

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSend).toHaveBeenCalledTimes(1);

    const sendBtn = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(sendBtn);
    expect(onSend).toHaveBeenCalledTimes(2);
  });

  it('disables input and send button when disabled prop is true', () => {
    const onChange = vi.fn();
    const onSend = vi.fn();

    render(
      <ChatInput
        value=""
        onChange={onChange}
        onSend={onSend}
        disabled={true}
        rightSlot={<span data-testid="extra-slot">Extra</span>}
      />
    );

    expect(screen.getByPlaceholderText('Ask about books…')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByTestId('extra-slot')).toBeInTheDocument();
  });
});
