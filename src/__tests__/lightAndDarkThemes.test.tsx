/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { SahadhyayiCapabilities } from '@/components/SahadhyayiCapabilities';
import { BookPulseBar } from '@/components/social/BookPulseBar';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
  };
});

// Component to test theme hook
const ThemeInspector: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark-btn">Dark</button>
      <button onClick={() => setTheme('light')} data-testid="set-light-btn">Light</button>
    </div>
  );
};

describe('Light and Dark Theme Infrastructure', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes with default theme and applies class to document.documentElement', () => {
    render(
      <ThemeProvider>
        <ThemeInspector />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('current-theme');
    expect(['light', 'dark']).toContain(themeDisplay.textContent);
    expect(
      document.documentElement.classList.contains('light') ||
      document.documentElement.classList.contains('dark')
    ).toBe(true);
  });

  it('toggles theme between light and dark smoothly and updates localStorage and document root', () => {
    render(
      <ThemeProvider>
        <ThemeInspector />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    const setDarkBtn = screen.getByTestId('set-dark-btn');
    const setLightBtn = screen.getByTestId('set-light-btn');

    // Set explicitly to light
    fireEvent.click(setLightBtn);
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('sahadhyayi-theme')).toBe('light');

    // Toggle to dark
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('sahadhyayi-theme')).toBe('dark');

    // Toggle back to light
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Editorial Light and Dark Theme Component Validation', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  afterEach(() => {
    cleanup();
  });

  it('renders SahadhyayiCapabilities with dual light and dark theme classes', () => {
    render(
      <MemoryRouter>
        <SahadhyayiCapabilities />
      </MemoryRouter>
    );

    const section = screen.getByLabelText('Platform Capabilities');
    // Verify light background and dark background tokens are both present
    expect(section.className).toContain('bg-[#FAFAF8]');
    expect(section.className).toContain('dark:bg-[#0B0D0C]');
    const card = screen.getByText('Local Reader Map').closest('a');
    expect(card?.className).toContain('border-[#E8E8E3]');
    expect(card?.className).toContain('dark:border-[#26302A]');
  });

  it('renders BookPulseBar with dual light and dark theme tokens', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <BookPulseBar />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const pulseBar = screen.getByLabelText(/Book Pulse/i);
    expect(pulseBar).toBeInTheDocument();
    expect(pulseBar.className).toContain('border-[#E8E8E3]');
    expect(pulseBar.className).toContain('dark:border-[#29332D]');
    expect(pulseBar.className).toContain('bg-white/80');
    expect(pulseBar.className).toContain('dark:bg-[#111614]/80');
  });
});
