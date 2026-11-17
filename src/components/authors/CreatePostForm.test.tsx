// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
  reportMutate: vi.fn(),
  inappropriate: false,
}));

vi.mock('@/hooks/useAuthorPosts', () => ({
  useCreatePost: () => ({ mutateAsync: mocks.mutateAsync, isPending: mocks.isPending }),
}));

vi.mock('@/hooks/useTrustAndSafety', () => ({
  useReportContent: () => ({ mutate: mocks.reportMutate }),
}));

vi.mock('@/utils/trustAndSafety', () => ({
  containsInappropriateLanguage: () => mocks.inappropriate,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select aria-label="Post Type" value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));

import { CreatePostForm } from './CreatePostForm';

const openForm = () => {
  fireEvent.click(screen.getByRole('button', { name: /share an update with your followers/i }));
};

describe('CreatePostForm', () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset().mockResolvedValue({ id: 'post-1' });
    mocks.reportMutate.mockReset();
    mocks.isPending = false;
    mocks.inappropriate = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('expands the composer and prevents publishing blank content', () => {
    render(<CreatePostForm authorId="author-1" />);

    openForm();

    expect(screen.getByRole('heading', { name: 'Create New Post' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Post Type' })).toHaveValue('status_update');
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('publishes trimmed status updates and resets the composer after success', async () => {
    const onPostCreated = vi.fn();
    render(<CreatePostForm authorId="author-1" onPostCreated={onPostCreated} />);
    openForm();

    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '  A thoughtful update  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({
      title: undefined,
      content: 'A thoughtful update',
      post_type: 'status_update',
      allow_comments: true,
      image_url: undefined,
      video_url: undefined,
      is_published: true,
    }));
    expect(onPostCreated).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /share an update with your followers/i })).toBeInTheDocument();

    openForm();
    expect(screen.getByLabelText('Content')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Post Type' })).toHaveValue('status_update');
  });

  it('publishes blog posts with trimmed title and media URLs and respects comment privacy', async () => {
    render(<CreatePostForm authorId="author-1" />);
    openForm();

    fireEvent.change(screen.getByRole('combobox', { name: 'Post Type' }), { target: { value: 'blog_post' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Reading Notes  ' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '  A longer article  ' } });
    fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: '  https://example.com/image.jpg  ' } });
    fireEvent.change(screen.getByLabelText('Video URL'), { target: { value: '  https://example.com/video  ' } });
    fireEvent.click(screen.getByLabelText('Allow comments'));

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({
      title: 'Reading Notes',
      content: 'A longer article',
      post_type: 'blog_post',
      allow_comments: false,
      image_url: 'https://example.com/image.jpg',
      video_url: 'https://example.com/video',
      is_published: true,
    }));
  });

  it('ignores unsupported post types rather than changing the selected type', () => {
    render(<CreatePostForm authorId="author-1" />);
    openForm();

    fireEvent.change(screen.getByRole('combobox', { name: 'Post Type' }), { target: { value: 'unsupported' } });

    expect(screen.getByRole('combobox', { name: 'Post Type' })).toHaveValue('status_update');
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('reports unsafe language and still submits the post for moderation', async () => {
    mocks.inappropriate = true;
    render(<CreatePostForm authorId="author-1" />);
    openForm();

    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'A flagged message' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalled());
    expect(mocks.reportMutate).toHaveBeenCalledWith({
      contentId: 'author-1',
      contentType: 'post',
      reason: 'Inappropriate language in post',
    });
  });

  it('keeps the draft open when publishing fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.mutateAsync.mockRejectedValueOnce(new Error('publish failed'));
    render(<CreatePostForm authorId="author-1" />);
    openForm();

    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Keep this draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(consoleError).toHaveBeenCalledWith('Error creating post:', expect.any(Error)));
    expect(screen.getByLabelText('Content')).toHaveValue('Keep this draft');
    expect(screen.getByRole('heading', { name: 'Create New Post' })).toBeInTheDocument();
  });

  it('shows a disabled publishing state while the mutation is pending', () => {
    mocks.isPending = true;
    render(<CreatePostForm authorId="author-1" />);
    openForm();

    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Pending update' } });

    expect(screen.getByRole('button', { name: 'Publishing...' })).toBeDisabled();
  });
});
