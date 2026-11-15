import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatHeader } from '@/components/chatbot/presentational/ChatHeader';
import * as consentModule from '@/hooks/useEnhancedGeminiTraining';

describe('ChatHeader', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders title, subtitle, and privacy link', () => {
    vi.spyOn(consentModule, 'getAiTrainingConsent').mockReturnValue(false);

    render(
      <MemoryRouter>
        <ChatHeader title="Sahadhyayi Assistant" subtitle="Online" />
      </MemoryRouter>
    );

    expect(screen.getByText('Sahadhyayi Assistant')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toHaveAttribute('href', '/privacy-policy#ai-training');
    expect(screen.getByText('Private Mode')).toBeInTheDocument();
  });

  it('toggles consent on button click', () => {
    vi.spyOn(consentModule, 'getAiTrainingConsent').mockReturnValue(false);
    const setConsentSpy = vi.spyOn(consentModule, 'setAiTrainingConsent').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ChatHeader title="Assistant" />
      </MemoryRouter>
    );

    const consentBtn = screen.getByRole('button', { name: /private mode/i });
    fireEvent.click(consentBtn);

    expect(setConsentSpy).toHaveBeenCalledWith(true);
    expect(screen.getByText('AI Training: On')).toBeInTheDocument();
  });
});
