import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FollowAuthorButton from './FollowAuthorButton';

const mockToggle = vi.fn();
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'viewer-user-id' } }),
}));

vi.mock('@/hooks/useArticleSocial', () => ({
  useAuthorFollowStatus: () => ({ followersCount: 42, isFollowing: false }),
  useToggleFollowAuthor: () => ({ mutate: mockToggle, isPending: false }),
}));

describe('FollowAuthorButton', () => {
  it('does not render for own profile', () => {
    const { container } = render(
      <FollowAuthorButton authorUserId="viewer-user-id" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders follow button for other authors and triggers toggle', () => {
    render(<FollowAuthorButton authorUserId="author-user-id" authorName="Jane Doe" />);

    const followBtn = screen.getByRole('button', { name: /follow/i });
    expect(followBtn).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    fireEvent.click(followBtn);
    expect(mockToggle).toHaveBeenCalledWith({
      authorUserId: 'author-user-id',
      isFollowing: false,
    });
  });
});
