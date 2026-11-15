import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  ChatbotContext,
  useChatbot,
  type ChatbotContextType,
} from '@/contexts/chatbotHelpers';

describe('chatbotHelpers', () => {
  it('throws an error if useChatbot is called outside of ChatbotProvider', () => {
    expect(() => renderHook(() => useChatbot())).toThrow(
      'useChatbot must be used within a ChatbotProvider'
    );
  });

  it('returns context value when wrapped in ChatbotContext.Provider', () => {
    const mockContextValue: ChatbotContextType = {
      isOpen: true,
      messages: [],
      toggleChat: () => {},
      closeChat: () => {},
      sendMessage: async () => 'response',
      isLoading: false,
      trainingDataCount: 42,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatbotContext.Provider value={mockContextValue}>
        {children}
      </ChatbotContext.Provider>
    );

    const { result } = renderHook(() => useChatbot(), { wrapper });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.trainingDataCount).toBe(42);
  });
});
