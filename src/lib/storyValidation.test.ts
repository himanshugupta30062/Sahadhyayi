import { describe, expect, it } from 'vitest';
import {
  validateStoryTitle,
  validateStoryDescription,
  validateStoryTags,
  validatePartTitle,
  validateStoryContent,
  validatePartCount,
  estimateReadingMinutes,
} from './storyValidation';
import { STORY_LIMITS } from '@/config/stories';

describe('storyValidation', () => {
  describe('validateStoryTitle', () => {
    it('requires title not to be blank', () => {
      expect(validateStoryTitle('').isValid).toBe(false);
      expect(validateStoryTitle('   ').isValid).toBe(false);
    });

    it('accepts title up to 100 characters', () => {
      const validTitle = 'A'.repeat(100);
      expect(validateStoryTitle(validTitle).isValid).toBe(true);
    });

    it('rejects title over 100 characters', () => {
      const invalidTitle = 'A'.repeat(101);
      const res = validateStoryTitle(invalidTitle);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('100');
    });
  });

  describe('validateStoryDescription', () => {
    it('allows empty or null description', () => {
      expect(validateStoryDescription('').isValid).toBe(true);
      expect(validateStoryDescription(null).isValid).toBe(true);
    });

    it('accepts description up to 500 characters', () => {
      const validDesc = 'B'.repeat(500);
      expect(validateStoryDescription(validDesc).isValid).toBe(true);
    });

    it('rejects description exceeding 500 characters', () => {
      const invalidDesc = 'B'.repeat(501);
      const res = validateStoryDescription(invalidDesc);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('500');
    });
  });

  describe('validateStoryTags', () => {
    it('accepts up to 5 tags', () => {
      expect(validateStoryTags(['fiction', 'mystery', 'india', 'philosophy', 'short']).isValid).toBe(true);
    });

    it('rejects more than 5 tags', () => {
      const res = validateStoryTags(['1', '2', '3', '4', '5', '6']);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('5');
    });
  });

  describe('validatePartTitle', () => {
    it('accepts part title up to 150 characters', () => {
      expect(validatePartTitle('Chapter 1: The Departure').isValid).toBe(true);
      expect(validatePartTitle('C'.repeat(150)).isValid).toBe(true);
    });

    it('rejects part title over 150 characters', () => {
      const res = validatePartTitle('C'.repeat(151));
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('150');
    });
  });

  describe('validateStoryContent and paragraph limits', () => {
    it('requires content not to be empty', () => {
      expect(validateStoryContent('').isValid).toBe(false);
    });

    it('rejects content exceeding 5,000 characters', () => {
      // 11 paragraphs of 460 chars = 5060 chars
      const longContent = Array(11).fill('D'.repeat(460)).join('\n\n');
      const res = validateStoryContent(longContent);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('5,000');
    });

    it('accepts valid multi-paragraph prose within 500 char paragraph limit', () => {
      const paragraphs = [
        'The rain began as a gentle mist against the teak window frames.',
        'Down in the courtyard, Ananya stood watching the old brass lantern swing slowly in the wind.',
        'She opened the worn journal and wrote the first line of the story she had carried for ten years.',
      ];
      const content = paragraphs.join('\n\n');
      const res = validateStoryContent(content);
      expect(res.isValid).toBe(true);
      expect(res.paragraphCount).toBe(3);
    });

    it('rejects single paragraphs that exceed 500 characters', () => {
      const longPara = 'E'.repeat(501);
      const res = validateStoryContent(longPara);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Paragraph 1 is too long');
      expect(res.error).toContain('500');
    });

    it('correctly identifies which paragraph exceeds limit in multi-paragraph text', () => {
      const content = [
        'Short paragraph one.',
        'F'.repeat(505),
        'Short paragraph three.',
      ].join('\n\n');
      const res = validateStoryContent(content);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Paragraph 2 is too long');
    });
  });

  describe('validatePartCount', () => {
    it('allows series up to 30 parts', () => {
      expect(validatePartCount(0).isValid).toBe(true);
      expect(validatePartCount(29).isValid).toBe(true);
      expect(validatePartCount(30).isValid).toBe(false);
    });
  });

  describe('estimateReadingMinutes', () => {
    it('calculates expected reading time accurately', () => {
      expect(estimateReadingMinutes('')).toBe(1);
      // 400 words = 2 minutes
      const text400 = Array(400).fill('word').join(' ');
      expect(estimateReadingMinutes(text400)).toBe(2);
    });
  });
});
