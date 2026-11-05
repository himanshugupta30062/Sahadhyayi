// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ArticleWrite from './ArticleWrite';
import * as articlesHook from '@/hooks/useArticles';
import { useAuth } from '@/contexts/authHelpers';

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
});
