import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Keep test execution independent from Vite's application-build configuration.
 * In particular, React Testing Library tests require a DOM even when a file-level
 * environment directive is missed by a runner or wrapper.
 */
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.ts'],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    testTimeout: 10_000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/* 2.*'],
    coverage: {
      provider: 'v8',
      enabled: false,
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/__tests__/**',
        'src/testSetup.ts',
        'src/integrations/supabase/types.ts',
        'archive/**',
        '**/* 2.*',
      ],
    },
  },
});
