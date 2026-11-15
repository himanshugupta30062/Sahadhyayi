import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsAppTab } from './WhatsAppTab';

vi.mock('./WhatsAppIntegration', () => ({
  WhatsAppIntegration: () => <div data-testid="whatsapp-integration">Integration Content</div>,
}));

vi.mock('./WhatsAppDiscovery', () => ({
  WhatsAppDiscovery: () => <div data-testid="whatsapp-discovery">Discovery Content</div>,
}));

describe('WhatsAppTab', () => {
  it('renders tab list with Setup and Discover tabs and initial content', () => {
    render(<WhatsAppTab />);

    expect(screen.getByText('WhatsApp Integration')).toBeInTheDocument();
    expect(screen.getByTestId('whatsapp-integration')).toBeInTheDocument();

    const setupTab = screen.getByRole('tab', { name: /setup/i });
    const discoverTab = screen.getByRole('tab', { name: /discover/i });
    expect(setupTab).toHaveAttribute('data-state', 'active');
    expect(discoverTab).toHaveAttribute('data-state', 'inactive');
  });
});
