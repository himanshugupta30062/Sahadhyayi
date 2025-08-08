import { describe, it, expect } from 'vitest';
import { AiAnswer } from './schema';

describe('AI schema', () => {
  it('accepts valid data', () => {
    const result = AiAnswer.safeParse({ reply: 'Hi', references: [] });
    expect(result.success).toBe(true);
  });

  it('rejects invalid data', () => {
    const result = AiAnswer.safeParse({ reply: '', references: [] });
    expect(result.success).toBe(false);
  });
});
