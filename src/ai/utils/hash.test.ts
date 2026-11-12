import { describe, expect, it } from 'vitest';
import { createHash } from './hash';

describe('createHash',()=>{
 it('is deterministic and distinguishes common inputs',()=>{
  expect(createHash('same')).toBe(createHash('same'));
  expect(createHash('alpha')).not.toBe(createHash('beta'));
 });
 it('returns a stable nonempty key for empty input',()=>{expect(createHash('')).toBe('h0');});
 it('handles longer strings without throwing',()=>{expect(createHash('x'.repeat(10000))).toMatch(/^h[0-9a-z]+$/);});
});