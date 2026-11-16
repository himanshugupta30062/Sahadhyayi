/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPolicy from './PrivacyPolicy';
import CookiePolicy from './CookiePolicy';

vi.mock('@/components/SEO', () => ({
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="seo" data-title={title} data-description={description} />
  ),
}));

describe('PrivacyPolicy Page', () => {
  it('renders privacy policy heading, SEO, and comprehensive compliance sections', () => {
    render(<PrivacyPolicy />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /1\. Introduction/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /2\. Information We Collect/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /4\. Social Map & Location Privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /5\. Sequel & Community Feedback Privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /9\. AI Assistant, Model Training & Data Protection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /13\. Grievance Redressal & Contact Us/i })).toBeInTheDocument();

    expect(screen.getByText(/Privacy at a Glance/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Data Selling/i)).toBeInTheDocument();
    expect(screen.getByText(/Bilateral Location Consent/i)).toBeInTheDocument();

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-title', 'Privacy Policy - Sahadhyayi');
    expect(screen.getAllByText(/gyan@sahadhyayi\.com/i).length).toBeGreaterThan(0);
  });
});

describe('CookiePolicy Page', () => {
  it('renders cookie policy heading, SEO, cookie inventory table, and browser guides', () => {
    render(<CookiePolicy />);

    expect(screen.getByRole('heading', { level: 1, name: 'Cookie Policy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /1\. What Are Cookies\?/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /2\. How We Use Cookies/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /3\. Types of Cookies We Use/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /5\. Managing Cookies/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /9\. Contact Us/i })).toBeInTheDocument();

    // Check itemized storage inventory table
    expect(screen.getByText('sb-*-auth-token')).toBeInTheDocument();
    expect(screen.getByText('theme')).toBeInTheDocument();
    expect(screen.getByText('reader-font-settings')).toBeInTheDocument();
    expect(screen.getByText('reader-offline-cache')).toBeInTheDocument();

    // Check browser instructions
    expect(screen.getByText(/Google Chrome:/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple Safari/i)).toBeInTheDocument();

    const seo = screen.getByTestId('seo');
    expect(seo).toHaveAttribute('data-title', 'Cookie Policy - Sahadhyayi');
  });
});
