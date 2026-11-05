import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('returns empty string for nullish or empty inputs', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify('')).toBe('');
  });

  it('converts titles into clean kebab-case slugs', () => {
    expect(slugify('The Great Gatsby')).toBe('the-great-gatsby');
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('Multiple---Hyphens___And Spaces')).toBe('multiple-hyphens-and-spaces');
  });

  it('supports Unicode and combining marks like Devanagari', () => {
    expect(slugify('सहध्यायी पुस्तक')).toBe('सहध्यायी-पुस्तक');
    expect(slugify('Premchand: गोदान')).toBe('premchand-गोदान');
  });

  it('falls back to basic hyphens if regex cleans to empty', () => {
    expect(slugify('***')).toBe('***');
  });
});

