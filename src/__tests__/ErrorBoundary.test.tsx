/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
  RefreshCw: () => null,
  Home: () => null,
}));

vi.mock('@/sentry', () => ({
  default: {
    captureException: vi.fn(() => 'test-error-id'),
    showReportDialog: vi.fn(),
  },
}));

function BrokenChild(): JSX.Element {
  throw new Error('Test render failure');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Healthy content</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Healthy content')).toBeTruthy();
  });

  it('renders the default recovery UI after a child render error', () => {
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary onError={onError}>
        <BrokenChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeTruthy();
    expect(screen.getByText(/Our team has been notified/i)).toBeTruthy();
    const reportLink = screen.getByRole('link', { name: /Report this issue/i });
    expect(reportLink.getAttribute('href')).toContain('/feedback?');
    expect(reportLink.getAttribute('href')).toContain('type=bug');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);

    consoleError.mockRestore();
  });

  it('renders a caller-provided fallback after an error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary fallback={<p>Custom recovery</p>}>
        <BrokenChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom recovery')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Something went wrong' })).toBeNull();
  });

  it('supports the reload and home recovery actions', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload, href: '/' },
    });

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Reload Page/i }));
    expect(reload).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Go to Home/i }));
    expect(window.location.href).toBe('/');
  });
});
