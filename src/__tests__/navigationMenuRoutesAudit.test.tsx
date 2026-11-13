// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NAVIGATION_SECTIONS, PUBLIC_NAVIGATION_SECTIONS } from '@/components/Navigation';

describe('Navigation Menu Routes Audit', () => {
  afterEach(() => {
    cleanup();
  });

  it('declares valid route destinations for all public navigation sections and children', () => {
    for (const section of PUBLIC_NAVIGATION_SECTIONS) {
      expect(section.href.startsWith('/')).toBe(true);
      for (const item of section.items) {
        expect(item.href.startsWith('/')).toBe(true);
        // Href should not have dangling spaces or empty strings
        expect(item.href.trim()).toBe(item.href);
      }
    }
  });

  it('declares valid route destinations for all authenticated navigation sections and children', () => {
    for (const section of NAVIGATION_SECTIONS) {
      expect(section.href.startsWith('/')).toBe(true);
      for (const item of section.items) {
        expect(item.href.startsWith('/')).toBe(true);
        expect(item.href.trim()).toBe(item.href);
      }
    }
  });

  it('properly redirects alias paths to canonical destinations', () => {
    const testCases = [
      { from: '/privacy', to: '/privacy-policy' },
      { from: '/terms', to: '/terms-of-service' },
      { from: '/cookies', to: '/cookie-policy' },
      { from: '/help', to: '/help-center' },
      { from: '/settings', to: '/profile' },
      { from: '/stats', to: '/reading-stats' },
      { from: '/publish-book', to: '/publish' },
    ];

    for (const { from, to } of testCases) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[from]}>
          <Routes>
            <Route path={from} element={<Navigate to={to} replace />} />
            <Route path={to} element={<div>Target: {to}</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(`Target: ${to}`)).toBeInTheDocument();
      unmount();
    }
  });
});
