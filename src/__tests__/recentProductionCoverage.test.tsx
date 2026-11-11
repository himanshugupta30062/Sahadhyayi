// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  joinMutate: vi.fn(),
  leaveMutate: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/useGroupManagement', () => ({
  DEFAULT_READING_GROUP_NAME: 'Sahadhyayi Community Reading Circle',
  useJoinGroup: () => ({ mutate: mocks.joinMutate, isPending: false }),
  useLeaveGroup: () => ({ mutate: mocks.leaveMutate, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError },
}));

import GroupCard from '@/components/groups/GroupCard';
import HomeEditorialPreview from '@/components/home/HomeEditorialPreview';

const group = (overrides: Record<string, unknown> = {}) => ({
  id: 'group-1',
  name: 'Fantasy Readers',
  description: 'Read and discuss fantasy together.',
  created_by: 'reader-2',
  created_at: '2026-01-01T00:00:00Z',
  group_members: [{ count: 17 }],
  ...overrides,
});

const renderGroup = (props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <GroupCard group={group()} {...props} />
  </MemoryRouter>,
);

describe('GroupCard', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.joinMutate.mockReset();
    mocks.leaveMutate.mockReset();
    mocks.toastError.mockReset();
  });

  afterEach(() => cleanup());

  it('renders group details and member count', () => {
    renderGroup();
    expect(screen.getByRole('heading', { name: 'Fantasy Readers' })).toBeInTheDocument();
    expect(screen.getByText('Read and discuss fantasy together.')).toBeInTheDocument();
    expect(screen.getByText('17 members')).toBeInTheDocument();
    expect(screen.getByText('Reading Group')).toBeInTheDocument();
  });

  it('asks guests to sign in instead of joining', () => {
    renderGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Join Group' }));
    expect(mocks.toastError).toHaveBeenCalledWith('Please sign in to join groups');
    expect(mocks.joinMutate).not.toHaveBeenCalled();
  });

  it('joins a group using the hook when no callback is supplied', () => {
    mocks.user = { id: 'reader-1' };
    renderGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Join Group' }));
    expect(mocks.joinMutate).toHaveBeenCalledWith('group-1');
  });

  it('shows joined state without offering a duplicate join or leave action', () => {
    mocks.user = { id: 'reader-1' };
    const onJoin = vi.fn();
    const onLeave = vi.fn();
    renderGroup({ onJoin, onLeave, isJoined: true });
    expect(screen.getByLabelText('Already joined this reading group')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join Group' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Leave Group' })).not.toBeInTheDocument();
    expect(onJoin).not.toHaveBeenCalled();
    expect(onLeave).not.toHaveBeenCalled();
    expect(mocks.leaveMutate).not.toHaveBeenCalled();
  });

  it('renders chat for joined members without a leave action', () => {
    mocks.user = { id: 'reader-1' };
    const onChat = vi.fn();
    renderGroup({ isJoined: true, onChat });
    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    expect(onChat).toHaveBeenCalledWith('group-1');
    expect(screen.queryByRole('button', { name: 'Leave Group' })).not.toBeInTheDocument();
    expect(mocks.leaveMutate).not.toHaveBeenCalled();
  });

  it('prevents leaving the permanent default reading community', () => {
    mocks.user = { id: 'reader-1' };
    render(
      <MemoryRouter>
        <GroupCard
          group={group({ name: 'Sahadhyayi Community Reading Circle' })}
          isJoined
        />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Already joined this reading group')).toHaveTextContent('Permanent Community Member');
    expect(screen.queryByRole('button', { name: 'Permanent Community Member' })).not.toBeInTheDocument();
    expect(mocks.leaveMutate).not.toHaveBeenCalled();
  });
});

describe('HomeEditorialPreview', () => {
  afterEach(() => cleanup());

  it('clearly separates owner-published blog stories from community articles', () => {
    render(
      <MemoryRouter>
        <HomeEditorialPreview />
      </MemoryRouter>,
    );
    expect(screen.getByRole('region', { name: 'From the reading world and our community' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ideas and updates from the world of books' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Learn from fellow readers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Blogs' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Explore Articles' })).toHaveAttribute('href', '/articles');
  });
});
