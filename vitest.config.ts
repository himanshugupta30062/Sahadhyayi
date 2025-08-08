import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    coverage: { reporter: ['text', 'lcov'], lines: 85 },
    exclude: ['tests/e2e/**'],
    include: ['src/**/*.test.{ts,tsx}']
  }
});
