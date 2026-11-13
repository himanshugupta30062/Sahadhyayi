// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Feedback from './Feedback';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

describe('Feedback', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders feedback form inputs properly', () => {
    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Share Your Feedback' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Feedback' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message \*/i)).toBeInTheDocument();
  });

  it('shows validation warning when submitting with missing fields', () => {
    render(
      <MemoryRouter>
        <Feedback />
      </MemoryRouter>
    );

    const form = screen.getByRole('button', { name: /Send Feedback/i }).closest('form')!;
    fireEvent.submit(form);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Missing Information',
        variant: 'destructive',
      })
    );
  });

  it('submits feedback successfully to Supabase', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const mockInvoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    vi.spyOn(supabase, 'functions', 'get').mockReturnValue({ invoke: mockInvoke } as any);

    render(
      <MemoryRouter initialEntries={['/feedback?type=bug']}>
        <Feedback />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Name \*/i), { target: { value: 'Alice Reader' } });
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Broken pagination' } });
    fireEvent.change(screen.getByLabelText(/Message \*/i), { target: { value: 'Page 2 is not loading properly.' } });

    const form = screen.getByRole('button', { name: /Send Feedback/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Alice Reader',
          email: 'alice@example.com',
          type: 'bug',
          subject: 'Broken pagination',
          message: 'Page 2 is not loading properly.',
        })
      );
      expect(mockInvoke).toHaveBeenCalledWith(
        'send-contact-email',
        expect.objectContaining({
          body: expect.objectContaining({
            name: 'Alice Reader',
            email: 'alice@example.com',
          }),
        })
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Feedback Submitted!',
        })
      );
    });
  });
});
