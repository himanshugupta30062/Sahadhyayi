import { describe, it, expect, vi } from 'vitest';

vi.mock('web-vitals', () => ({
  onCLS: vi.fn((cb) => cb({ name: 'CLS', value: 0.05 })),
  onINP: vi.fn((cb) => cb({ name: 'INP', value: 40 })),
  onLCP: vi.fn((cb) => cb({ name: 'LCP', value: 1200 })),
  onTTFB: vi.fn((cb) => cb({ name: 'TTFB', value: 150 })),
  onFCP: vi.fn((cb) => cb({ name: 'FCP', value: 800 })),
}));

describe('webVitals', () => {
  it('registers all vitals callbacks and logs metrics without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await import('./webVitals');
    expect(consoleSpy).toHaveBeenCalledWith('[web-vitals]', expect.any(String), expect.any(Number));
    consoleSpy.mockRestore();
  });
});
