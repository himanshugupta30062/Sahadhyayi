// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ArticleWrite from './ArticleWrite';
import * as articlesHook from '@/hooks/useArticles';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/articles/RichTextToolbar', () => ({
  default: () => <div data-testid="rich-text-toolbar" />,
}));

vi.mock('@/components/articles/MarkdownPreview', () => ({
  default: ({ content }: any) => <div data-testid="markdown-preview">{content}</div>,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('ArticleWrite', () => {
  const mockCreateMutateAsync = vi.fn();
  const mockUpdateMutateAsync = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);
    vi.spyOn(articlesHook, 'useCreateArticle').mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as any);
    vi.spyOn(articlesHook, 'useUpdateArticle').mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders form elements for writing a new article', () => {
    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Article title\.\.\./i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add a subtitle/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tell your story/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish/i })).toBeInTheDocument();
  });

  it('shows validation errors when title or content are too short', () => {
    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Article title\.\.\./i), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /Publish/i }));

    expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getByText('Article must be at least 50 characters')).toBeInTheDocument();
  });

  it('successfully publishes article when form is valid', async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 'art-1', slug: 'a-deep-dive-into-literature' });

    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Article title\.\.\./i), {
      target: { value: 'A Deep Dive Into Literature' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tell your story/i), {
      target: { value: 'This is a comprehensive study of classic literary works across centuries and civilizations.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Publish/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'A Deep Dive Into Literature',
          content: 'This is a comprehensive study of classic literary works across centuries and civilizations.',
          is_published: true,
        })
      );
    });
  });

  it('saves draft article without publishing', async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 'art-1', slug: 'draft-study' });

    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Article title\.\.\./i), {
      target: { value: 'Draft Study of Epics' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tell your story/i), {
      target: { value: 'This draft contains early notes on Mahabharata, Ramayana, and ancient poetic meters.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Draft/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Draft Study of Epics',
          content: 'This draft contains early notes on Mahabharata, Ramayana, and ancient poetic meters.',
          is_published: false,
        })
      );
    });
  });

  it('handles adding and removing tags', () => {
    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    const tagInput = screen.getByPlaceholderText(/Add a tag/i);
    fireEvent.change(tagInput, { target: { value: 'philosophy' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    const addTagBtn = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addTagBtn);

    expect(screen.getByText('philosophy')).toBeInTheDocument();

    // Remove the tag by clicking on it
    fireEvent.click(screen.getByText('philosophy'));

    expect(screen.queryByText('philosophy')).not.toBeInTheDocument();
  });

  it('toggles preview mode on and off', () => {
    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Article title\.\.\./i), {
      target: { value: 'Preview Test Title' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tell your story/i), {
      target: { value: 'Some markdown content to preview in reading view.' },
    });

    const previewBtn = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewBtn);

    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();

    // Toggle back to edit
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByPlaceholderText(/Article title\.\.\./i)).toBeInTheDocument();
  });

  it('loads existing article and updates it in edit mode', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'edit-101',
              user_id: 'user-1',
              title: 'Original Title',
              subtitle: 'Original Subtitle',
              content: 'Original content that exceeds the minimum required length of fifty characters easily.',
              tags: ['history'],
              cover_image_url: 'https://example.com/cover.jpg',
              is_published: true,
              slug: 'original-title',
            },
            error: null,
          }),
        }),
      }),
    });

    mockUpdateMutateAsync.mockResolvedValue({ id: 'edit-101', slug: 'updated-title' });

    render(
      <MemoryRouter initialEntries={['/articles/edit/edit-101']}>
        <Routes>
          <Route path="/articles/edit/:id" element={<ArticleWrite />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Original Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original Subtitle')).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const updateBtn = screen.getByRole('button', { name: /update/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'edit-101',
          title: 'Updated Title',
          is_published: true,
        })
      );
    });
  });

  it('handles keyboard shortcuts in content textarea', () => {
    render(
      <MemoryRouter>
        <ArticleWrite />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Tell your story/i);
    fireEvent.keyDown(textarea, { key: 'Tab' });
    expect(textarea).toHaveValue('  ');

    fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });
    expect(textarea).toHaveValue('  **bold text**');
  });
});
