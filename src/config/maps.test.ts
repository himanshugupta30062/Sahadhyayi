import { describe, it, expect } from 'vitest';
import { GOOGLE_MAPS_API_KEY } from './maps';

describe('maps config', () => {
  it('exports GOOGLE_MAPS_API_KEY as a string', () => {
    expect(typeof GOOGLE_MAPS_API_KEY).toBe('string');
  });
});
