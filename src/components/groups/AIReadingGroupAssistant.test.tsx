// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AIReadingGroupAssistant from './AIReadingGroupAssistant';

const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/hooks/useVoiceReading', () => ({
  useVoiceReading: () => ({
    isSupported: true,
    isPlaying: false,
    isPaused: false,
    speak: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    toggle: vi.fn(),
  }),
}));

describe('AIReadingGroupAssistant', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders group organizer options for schedules, agendas, and questions', () => {
    render(<AIReadingGroupAssistant initialBookTitle="The Discovery of India" groupName="Sahadhyayi Readers Club" />);

    expect(screen.getByText('AI Reading Group Assistant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('The Discovery of India')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4-week reading schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /60-minute meeting agenda/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discussion prompts/i })).toBeInTheDocument();
  });

  it('generates agenda on button click and displays output', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        reply: 'Week 1: Chapters 1-3. Discussion checkpoint on Thursday.\nWeek 2: Chapters 4-6.',
      },
      error: null,
    });

    render(<AIReadingGroupAssistant initialBookTitle="The Discovery of India" groupName="Sahadhyayi Readers Club" />);

    const scheduleBtn = screen.getByRole('button', { name: /4-week reading schedule/i });
    fireEvent.click(scheduleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Week 1: Chapters 1-3/i)).toBeInTheDocument();
    });
  });
});

