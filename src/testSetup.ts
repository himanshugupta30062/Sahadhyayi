import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are disabled; register explicit cleanup so hook listeners and
// rendered DOM cannot leak between tests.
afterEach(() => cleanup());
