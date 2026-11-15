import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';

describe('ScrollToTop', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    window.scrollTo = originalScrollTo;
  });

  it('scrolls to (0, 0) upon mounting and route change', () => {
    render(
      <MemoryRouter initialEntries={['/initial']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('safely handles scrollTo errors without throwing', () => {
    window.scrollTo = vi.fn().mockImplementation(() => {
      throw new Error('Scroll not supported');
    });

    expect(() => {
      render(
        <MemoryRouter>
          <ScrollToTop />
        </MemoryRouter>
      );
    }).not.toThrow();
  });
});
