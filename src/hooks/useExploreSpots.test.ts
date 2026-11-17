import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));
vi.mock('@/integrations/supabase/client-universal', () => ({ supabase: {} }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: null }) }));

import {
  getExploreBoundingBox,
  isValidExploreCoordinates,
  normalizeExploreRadiusKm,
} from './useExploreSpots';

describe('Explore Map geographic input helpers', () => {
  it('clamps search radius to the supported 1–50 km range', () => {
    expect(normalizeExploreRadiusKm(0)).toBe(1);
    expect(normalizeExploreRadiusKm(25)).toBe(25);
    expect(normalizeExploreRadiusKm(100)).toBe(50);
    expect(normalizeExploreRadiusKm(Number.NaN)).toBe(25);
  });

  it('rejects invalid or out-of-range coordinates before querying map providers', () => {
    expect(isValidExploreCoordinates({ lat: 28.6139, lng: 77.209 })).toBe(true);
    expect(isValidExploreCoordinates({ lat: 91, lng: 77.209 })).toBe(false);
    expect(isValidExploreCoordinates({ lat: 28.6, lng: 181 })).toBe(false);
    expect(isValidExploreCoordinates({ lat: Number.NaN, lng: 77 })).toBe(false);
  });

  it('builds a bounded bounding box around the requested radius', () => {
    const bounds = getExploreBoundingBox({ lat: 28.6139, lng: 77.209 }, 25);
    expect(bounds.south).toBeLessThan(28.6139);
    expect(bounds.north).toBeGreaterThan(28.6139);
    expect(bounds.west).toBeLessThan(77.209);
    expect(bounds.east).toBeGreaterThan(77.209);
    expect(bounds.north - bounds.south).toBeCloseTo((50 / 111), 3);
  });

  it('keeps bounding coordinates within valid world limits near the poles', () => {
    const bounds = getExploreBoundingBox({ lat: 89.9, lng: 179.9 }, 50);
    expect(bounds.north).toBe(90);
    expect(bounds.east).toBe(180);
    expect(bounds.south).toBeGreaterThanOrEqual(-90);
    expect(bounds.west).toBeGreaterThanOrEqual(-180);
  });
});
