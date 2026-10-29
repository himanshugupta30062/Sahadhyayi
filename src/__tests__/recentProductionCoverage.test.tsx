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

  it('uses join and leave callbacks when provided', () => {
    mocks.user = { id: 'reader-1' };
    const onJoin = vi.fn();
    const onLeave = vi.fn();
    renderGroup({ onJoin, onLeave, isJoined: true });
    fireEvent.click(screen.getByRole('button', { name: 'Leave Group' }));
    expect(onLeave).toHaveBeenCalledWith('group-1');
    expect(mocks.leaveMutate).not.toHaveBeenCalled();
  });

  it('uses the leave mutation and renders chat for joined members', () => {
    mocks.user = { id: 'reader-1' };
    const onChat = vi.fn();
    renderGroup({ isJoined: true, onChat });
    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    expect(onChat).toHaveBeenCalledWith('group-1');
    fireEvent.click(screen.getByRole('button', { name: 'Leave Group' }));
    expect(mocks.leaveMutate).toHaveBeenCalledWith('group-1');
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
    const button = screen.getByRole('button', { name: 'Permanent Community Member' });
    expect(button).toBeDisabled();
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
