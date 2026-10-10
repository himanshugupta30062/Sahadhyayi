// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeedComposer } from '@/components/social/FeedComposer';
import { AddMarginNoteDialog } from '@/components/social/margins/AddMarginNoteDialog';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; user_metadata: Record<string, string> },
  post: vi.fn(), note: vi.fn(), upload: vi.fn(), toast: vi.fn(),
}));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/useSocialPosts', () => ({ useCreatePost: () => ({ mutateAsync: mocks.post, isPending: false }) }));
vi.mock('@/hooks/useMarginNotes', () => ({ useCreateMarginNote: () => ({ mutateAsync: mocks.note, isPending: false }) }));
vi.mock('@/hooks/useUserBookshelf', () => ({ useUserBookshelf: () => ({ data: [] }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload }) } } }));
vi.mock('@/components/social/BookSelectionModal', () => ({ BookSelectionModal: () => null }));
vi.mock('@/components/social/EmojiPicker', () => ({ EmojiPicker: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.user = null; });

describe('community submission safety', () => {
  it('never publishes or clears a photo draft when storage rejects the upload', async () => {
    mocks.user = { id: 'reader', user_metadata: {} };
    mocks.upload.mockResolvedValue({ error: { message: 'Storage unavailable' } });
    const { container } = render(<FeedComposer />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My photo draft' } });
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error('Missing file input');
    fireEvent.change(input, { target: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Post', exact: true }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
    expect(mocks.post).not.toHaveBeenCalled();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('My photo draft');
    expect((input as HTMLInputElement).files?.[0]?.name).toBe('photo.png');
  });

  it('offers sign-in before guests can enter or submit a margin note, preserving the return path', () => {
    render(<MemoryRouter initialEntries={['/book/test?tab=notes']}><AddMarginNoteDialog open initialBookId="test" /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Sign in to add a margin note' });
    expect(link.getAttribute('href')).toBe('/signin?redirect=%2Fbook%2Ftest%3Ftab%3Dnotes');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(mocks.note).not.toHaveBeenCalled();
  });
});