// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResearchPaperSubmission from './ResearchPaperSubmission';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/hooks/use-toast';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ResearchPaperSubmission', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders submission form with default categories', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { slug: 'article', name: 'Research article', description: 'Original', display_order: 1 },
          { slug: 'review', name: 'Review paper', description: 'Review', display_order: 2 },
        ],
        error: null,
      }),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

    render(
      <MemoryRouter initialEntries={['/research-papers/submit?kind=contribute']}>
        <ResearchPaperSubmission />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Add a research paper' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Paper title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Authors/i)).toBeInTheDocument();
  });

  it('warns when unauthenticated user tries to submit', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    render(
      <MemoryRouter initialEntries={['/research-papers/submit?kind=contribute']}>
        <ResearchPaperSubmission />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Paper title/i), { target: { value: 'Test Paper' } });
    fireEvent.change(screen.getByLabelText(/Authors/i), { target: { value: 'Test Author' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit for review/i }));

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sign in to submit a research paper',
        variant: 'destructive',
      })
    );
  });

  it('submits successfully when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-xyz' } } as any);
    const mockInvoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    vi.spyOn(supabase, 'functions', 'get').mockReturnValue({ invoke: mockInvoke } as any);

    // Mock window.location.assign
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { assign: assignSpy },
    });

    render(
      <MemoryRouter initialEntries={['/research-papers/submit?kind=contribute']}>
        <ResearchPaperSubmission />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Paper title/i), { target: { value: 'Neural Network Advances' } });
    fireEvent.change(screen.getByLabelText(/Authors/i), { target: { value: 'Dr. John Doe' } });
    fireEvent.change(screen.getByLabelText(/Abstract \/ summary/i), { target: { value: 'Comprehensive study.' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit for review/i }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('submit-research-paper', expect.objectContaining({
        body: expect.objectContaining({
          title: 'Neural Network Advances',
          authors: 'Dr. John Doe',
          submission_kind: 'contribute',
        }),
      }));
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Research paper submitted',
      }));
      expect(assignSpy).toHaveBeenCalledWith('/my-research-submissions');
    });
  });
});

