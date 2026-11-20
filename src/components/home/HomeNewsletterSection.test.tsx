import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeNewsletterSection from './HomeNewsletterSection';
import * as newsletterService from '@/services/newsletterService';

describe('HomeNewsletterSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading, description, input, and privacy policy link', () => {
    render(
      <MemoryRouter>
        <HomeNewsletterSection />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Stay Inspired\. Stay Curious\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/thoughtful reading recommendations, new book discoveries/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subscribe/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute(
      'href',
      '/privacy-policy'
    );
  });

  it('disables subscribe button when input is empty', () => {
    render(
      <MemoryRouter>
        <HomeNewsletterSection />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /Subscribe/i });
    expect(button).toBeDisabled();
  });

  it('submits email and displays success message on successful subscription', async () => {
    vi.spyOn(newsletterService, 'subscribeToNewsletter').mockResolvedValueOnce({
      success: true,
      message: "You're subscribed! Look forward to discovering something wonderful.",
    });

    render(
      <MemoryRouter>
        <HomeNewsletterSection />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Enter your email address/i);
    const button = screen.getByRole('button', { name: /Subscribe/i });

    fireEvent.change(input, { target: { value: 'reader@example.com' } });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("You're subscribed! Look forward to discovering something wonderful.")
      ).toBeInTheDocument();
    });

    // Input should be cleared on success
    expect(input).toHaveValue('');
  });

  it('displays duplicate message when email is already subscribed', async () => {
    vi.spyOn(newsletterService, 'subscribeToNewsletter').mockResolvedValueOnce({
      success: false,
      duplicate: true,
      message: 'This email is already subscribed.',
    });

    render(
      <MemoryRouter>
        <HomeNewsletterSection />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Enter your email address/i);
    const button = screen.getByRole('button', { name: /Subscribe/i });

    fireEvent.change(input, { target: { value: 'existing@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('This email is already subscribed.')).toBeInTheDocument();
    });
  });

  it('displays error message when subscription fails', async () => {
    vi.spyOn(newsletterService, 'subscribeToNewsletter').mockResolvedValueOnce({
      success: false,
      duplicate: false,
      message: 'Something went wrong. Please try again.',
    });

    render(
      <MemoryRouter>
        <HomeNewsletterSection />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Enter your email address/i);
    const button = screen.getByRole('button', { name: /Subscribe/i });

    fireEvent.change(input, { target: { value: 'error@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });
});
