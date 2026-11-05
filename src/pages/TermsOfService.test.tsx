/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import TermsOfService from './TermsOfService';

vi.mock('@/components/SEO', () => ({
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="seo" data-title={title} data-description={description} />
  ),
}));

describe('TermsOfService', () => {
  it('renders terms of service heading, SEO and core policy sections', () => {
    render(<TermsOfService />);

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument();
    expect(screen.getByText(/Last updated: January 2024/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '1. Acceptance of Terms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2. Description of Service' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '3. User Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '4. Acceptable Use' })).toBeInTheDocument();

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-title', 'Terms of Service - Sahadhyayi');
  });
});

