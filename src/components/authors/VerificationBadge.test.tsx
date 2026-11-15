import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerificationBadge } from './VerificationBadge';

describe('VerificationBadge', () => {
  it('returns null when verified is false', () => {
    const { container } = render(<VerificationBadge verified={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders default verified badge', () => {
    render(<VerificationBadge verified={true} />);
    const badge = screen.getByText(/verified/i);
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.cursor-help')).toHaveAttribute('title', 'Verified Author');
  });

  it('renders publisher verified type', () => {
    render(<VerificationBadge verified={true} verificationType="publisher" />);
    const badge = screen.getByTitle('Verified by Publisher');
    expect(badge).toBeInTheDocument();
  });

  it('renders document verified type', () => {
    render(<VerificationBadge verified={true} verificationType="document" />);
    const badge = screen.getByTitle('Document Verified');
    expect(badge).toBeInTheDocument();
  });

  it('renders manual verified type', () => {
    render(<VerificationBadge verified={true} verificationType="manual" />);
    const badge = screen.getByTitle('Manually Verified');
    expect(badge).toBeInTheDocument();
  });
});
