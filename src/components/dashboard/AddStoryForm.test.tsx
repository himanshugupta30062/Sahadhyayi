import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AddStoryForm from '@/components/dashboard/AddStoryForm';
import { supabase } from '@/integrations/supabase/client-universal';

describe('AddStoryForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders form inputs and handles cancel button', () => {
    const onClose = vi.fn();
    render(<AddStoryForm userId="u-123" onClose={onClose} />);

    expect(screen.getByText('Write or Record New Story')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Story Content')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('submits text story and calls onClose upon success', async () => {
    const onClose = vi.fn();
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    render(<AddStoryForm userId="u-123" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Journey' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A short tale' } });
    fireEvent.change(screen.getByLabelText('Story Content'), { target: { value: 'Once upon a time...' } });

    const publishBtn = screen.getByRole('button', { name: 'Publish' });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        {
          user_id: 'u-123',
          title: 'My Journey',
          description: 'A short tale',
          content: 'Once upon a time...',
          format: 'text',
          audio_url: undefined,
        },
      ]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('switches to voice format when selected', () => {
    render(<AddStoryForm userId="u-123" onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'audio' } });
    expect(screen.getByText('Upload Voice File (MP3/WAV)')).toBeInTheDocument();
    expect(screen.getByText('Audio upload/transcription coming soon!')).toBeInTheDocument();
  });
});
