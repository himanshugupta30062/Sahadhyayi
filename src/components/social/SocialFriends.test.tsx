import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialFriends } from './SocialFriends';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'user-sf-1' } }),
}));

vi.mock('./WhatsAppTab', () => ({
  WhatsAppTab: () => <div data-testid="whatsapp-tab-content">WhatsApp Content</div>,
}));

describe('SocialFriends', () => {
  it('renders friends list and filters by search input', () => {
    render(<SocialFriends />);

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Chen')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search friends/i);
    fireEvent.change(searchInput, { target: { value: 'Sarah' } });

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument();
  });
});
