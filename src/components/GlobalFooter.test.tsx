// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalFooter from './GlobalFooter';

const mocks = vi.hoisted(() => ({
  fetchStats: vi.fn(), joinCommunity: vi.fn(), toast: vi.fn(), navigate: vi.fn(),
  user: null as null | { email?: string },
}));
vi.mock('@/hooks/useCommunityStats', () => ({
  useCommunityStats: () => ({ isLoading: false, fetchStats: mocks.fetchStats, joinCommunity: mocks.joinCommunity }),
}));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mocks.navigate };
});

const renderFooter = () => render(<MemoryRouter><GlobalFooter /></MemoryRouter>);

describe('GlobalFooter', () => {
  beforeEach(() => { mocks.user = null; vi.clearAllMocks(); });

  it('renders footer navigation, social links and logged-out welcome', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Explore Sahadhyayi' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Support' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Company' })).toBeTruthy();
    expect(screen.getByText('Welcome to Sahadhyayi')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Facebook/i }).getAttribute('href')).toContain('facebook.com');
    expect(screen.getByRole('link', { name: 'Digital Library' }).getAttribute('href')).toBe('/library');
  });

  it('toggles community statistics and invokes fetch only when opening', () => {
    renderFooter();
    fireEvent.click(screen.getByRole('button', { name: /Show Community Stats/i }));
    expect(mocks.fetchStats).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Hide Community Stats/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Hide Community Stats/i }));
    expect(mocks.fetchStats).toHaveBeenCalledTimes(1);
  });

  it('persists join intent and opens sign-in dialog for guests', async () => {
    renderFooter();
    fireEvent.click(screen.getByRole('button', { name: /Join Community/i }));
    expect(localStorage.getItem('joinCommunityAfterSignIn')).toBe('true');
    expect(await screen.findByText('Please sign in to join our community.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(mocks.navigate).toHaveBeenCalledWith(expect.stringContaining('/signin?redirect='), expect.objectContaining({ state: expect.anything() }));
  });

  it('joins authenticated readers, shows feedback and navigates to social', async () => {
    mocks.user = { email: 'reader@example.com' };
    mocks.joinCommunity.mockResolvedValue(true);
    renderFooter();
    fireEvent.click(screen.getByRole('button', { name: /Join Community/i }));
    await waitFor(() => expect(mocks.joinCommunity).toHaveBeenCalled());
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Thanks for joining!' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/social');
    expect(screen.getByText('reader@example.com')).toBeTruthy();
  });

  it('handles unsuccessful join response with welcome toast', async () => {
    mocks.user = { email: 'reader@example.com' };
    mocks.joinCommunity.mockResolvedValue(false);
    renderFooter();
    fireEvent.click(screen.getByRole('button', { name: /Join Community/i }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Welcome!' })));
  });
});
