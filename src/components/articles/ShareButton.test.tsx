// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ShareButton from './ShareButton';

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  writeText: vi.fn(),
  invoke: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  navigate: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled, asChild }: any) =>
    asChild ? <>{children}</> : <button type="button" role="menuitem" onClick={onClick} disabled={disabled}>{children}</button>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button type="button" {...props}>{children}</button>,
}));
vi.mock('@/hooks/use-toast', () => ({ toast: mocks.toast }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
    from: mocks.from,
  },
}));

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = null;
    mocks.writeText.mockResolvedValue(undefined);
    mocks.invoke.mockResolvedValue({ data: { caption: 'A thoughtful caption' }, error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mocks.writeText },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders quick share links using the canonical production URL', () => {
    render(<ShareButton url="/articles/reading" title="Reading & meaning" variant="full" />);
    expect(screen.getByRole('button', { name: 'Share article' })).toHaveTextContent('Share');
    expect(screen.getByRole('link', { name: /X \/ Twitter/ })).toHaveAttribute(
      'href',
      'https://twitter.com/intent/tweet?text=Reading%20%26%20meaning&url=https%3A%2F%2Fsahadhyayi.com%2Farticles%2Freading',
    );
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fsahadhyayi.com%2Farticles%2Freading',
    );
  });

  it('copies the canonical link and reports success or failure', async () => {
    render(<ShareButton url="https://example.test/article" title="Article" />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith('https://example.test/article'));
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Link copied to clipboard' });

    mocks.writeText.mockRejectedValueOnce(new Error('clipboard unavailable'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Failed to copy link', variant: 'destructive',
    }));
  });

  it('generates an AI caption and opens the Twitter share intent', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton url="/book/123" title="A Book" subtitle="Subtitle" content="Body" />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'X / Twitter' }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('generate-share-caption', {
      body: {
        platform: 'twitter', title: 'A Book', subtitle: 'Subtitle', content: 'Body',
        url: 'https://sahadhyayi.com/book/123',
      },
    }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(
      'https://twitter.com/intent/tweet?text=A%20thoughtful%20caption&url=https%3A%2F%2Fsahadhyayi.com%2Fbook%2F123',
      '_blank', 'noopener,noreferrer,width=600,height=600',
    ));
  });

  it('requires authentication before sharing internally', async () => {
    render(<ShareButton url="/article" title="Article" />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Post on Sahadhyayi' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Sign in required', description: 'Please sign in to share on Sahadhyayi.',
      variant: 'destructive',
    }));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('creates an internal post with the caption and cover then navigates to the feed', async () => {
    mocks.user = { id: 'reader-1' };
    vi.useFakeTimers();
    render(<ShareButton url="/article/42" title="Article 42" coverImageUrl="cover.jpg" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Post on Sahadhyayi' }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.invoke).toHaveBeenCalledWith('generate-share-caption', expect.objectContaining({
      body: expect.objectContaining({ platform: 'facebook' }),
    }));
    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: 'reader-1',
      content: '📖 Article 42\n\nA thoughtful caption\n\n🔗 Read here: https://sahadhyayi.com/article/42',
      image_url: 'cover.jpg',
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Shared on Sahadhyayi! 🎉', description: 'Your article post is now live on the social feed.',
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    expect(mocks.navigate).toHaveBeenCalledWith('/social');
  });

  it('reports caption generation and internal post errors without opening a share window', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { message: 'AI unavailable' } });
    render(<ShareButton url="/article" title="Article" />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Facebook' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({
      title: 'AI caption failed', description: 'AI unavailable', variant: 'destructive',
    }));
    expect(open).not.toHaveBeenCalled();

    mocks.user = { id: 'reader-1' };
    mocks.insert.mockResolvedValueOnce({ error: { message: 'post rejected' } });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Post on Sahadhyayi' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Failed to share', description: 'post rejected', variant: 'destructive',
    }));
  });
});
