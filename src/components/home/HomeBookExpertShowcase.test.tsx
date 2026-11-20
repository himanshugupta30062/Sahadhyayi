import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeBookExpertShowcase from './HomeBookExpertShowcase';
import { BookExpertContext } from '@/contexts/book-expert.utils';

describe('HomeBookExpertShowcase', () => {
  it('renders default recommendation prompt and preview', () => {
    render(
      <MemoryRouter>
        <HomeBookExpertShowcase />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Meet Your Book Expert AI/i })).toBeInTheDocument();
    expect(screen.getByText(/Recommend 3 books similar to Siddhartha/i)).toBeInTheDocument();
    expect(screen.getByText(/The Prophet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask Book Expert AI/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Books/i })).toHaveAttribute('href', '/library');
  });

  it('switches active prompt when clicking prompt pills', () => {
    render(
      <MemoryRouter>
        <HomeBookExpertShowcase />
      </MemoryRouter>
    );

    // Click 'Deep Concept' prompt
    const conceptBtn = screen.getByRole('button', { name: 'Deep Concept' });
    fireEvent.click(conceptBtn);

    expect(screen.getByText(/Explain the concept of "Nishkama Karma"/i)).toBeInTheDocument();
    expect(screen.getByText(/Nishkama Karma advocates total absorption/i)).toBeInTheDocument();

    // Click 'Literary Critique' prompt
    const critiqueBtn = screen.getByRole('button', { name: 'Literary Critique' });
    fireEvent.click(critiqueBtn);

    expect(screen.getByText(/Compare the critique of state control in 1984 vs Brave New World/i)).toBeInTheDocument();
  });

  it('interacts with BookExpertContext when available', () => {
    const toggleChat = vi.fn();
    const sendMessage = vi.fn().mockResolvedValue(undefined);

    const mockContext: any = {
      isOpen: false,
      toggleChat,
      sendMessage,
    };

    render(
      <MemoryRouter>
        <BookExpertContext.Provider value={mockContext}>
          <HomeBookExpertShowcase />
        </BookExpertContext.Provider>
      </MemoryRouter>
    );

    const askBtn = screen.getByRole('button', { name: /Ask Book Expert AI/i });
    fireEvent.click(askBtn);

    expect(toggleChat).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('Recommend 3 books similar to Siddhartha')
    );
  });
});
