import { describe, it, expect } from 'vitest';
import { trendingBooks, curatedLists, implementEnhancedDiscovery } from './discoveryHelpers';

describe('discoveryHelpers', () => {
  it('provides trendingBooks array with valid attributes', () => {
    expect(Array.isArray(trendingBooks)).toBe(true);
    expect(trendingBooks.length).toBeGreaterThan(0);
    expect(trendingBooks[0]).toHaveProperty('title');
    expect(trendingBooks[0]).toHaveProperty('rating');
  });

  it('provides curatedLists with titles and books', () => {
    expect(Array.isArray(curatedLists)).toBe(true);
    expect(curatedLists.length).toBeGreaterThan(0);
    expect(curatedLists[0].books.length).toBeGreaterThan(0);
  });

  it('implementEnhancedDiscovery returns true', () => {
    expect(implementEnhancedDiscovery()).toBe(true);
  });
});
