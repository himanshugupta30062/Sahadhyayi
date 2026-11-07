import { STORY_LIMITS } from '@/config/stories';

export interface StoryValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  longestParagraphLength?: number;
  paragraphCount?: number;
}

export function validateStoryTitle(title: string): { isValid: boolean; error?: string } {
  const trimmed = title.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Title is required.' };
  }
  if (trimmed.length > STORY_LIMITS.STORY_TITLE_MAX) {
    return {
      isValid: false,
      error: `Title must be ${STORY_LIMITS.STORY_TITLE_MAX} characters or fewer (${trimmed.length}/${STORY_LIMITS.STORY_TITLE_MAX}).`,
    };
  }
  return { isValid: true };
}

export function validateStoryDescription(description?: string | null): { isValid: boolean; error?: string } {
  if (!description) return { isValid: true };
  const trimmed = description.trim();
  if (trimmed.length > STORY_LIMITS.STORY_DESCRIPTION_MAX) {
    return {
      isValid: false,
      error: `Description must be ${STORY_LIMITS.STORY_DESCRIPTION_MAX} characters or fewer (${trimmed.length}/${STORY_LIMITS.STORY_DESCRIPTION_MAX}).`,
    };
  }
  return { isValid: true };
}

export function validateStoryTags(tags: string[]): { isValid: boolean; error?: string } {
  if (tags.length > STORY_LIMITS.MAX_TAGS) {
    return {
      isValid: false,
      error: `You can add up to ${STORY_LIMITS.MAX_TAGS} tags only (${tags.length}/${STORY_LIMITS.MAX_TAGS}).`,
    };
  }
  return { isValid: true };
}

export function validatePartTitle(title: string): { isValid: boolean; error?: string } {
  const trimmed = title.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Part title is required.' };
  }
  if (trimmed.length > STORY_LIMITS.PART_TITLE_MAX) {
    return {
      isValid: false,
      error: `Part title must be ${STORY_LIMITS.PART_TITLE_MAX} characters or fewer (${trimmed.length}/${STORY_LIMITS.PART_TITLE_MAX}).`,
    };
  }
  return { isValid: true };
}

export function validateStoryContent(content: string): {
  isValid: boolean;
  error?: string;
  longestParagraphLength: number;
  paragraphCount: number;
} {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Story content cannot be empty.',
      longestParagraphLength: 0,
      paragraphCount: 0,
    };
  }

  if (trimmed.length > STORY_LIMITS.PART_CONTENT_MAX) {
    return {
      isValid: false,
      error: `Content exceeds maximum limit of ${STORY_LIMITS.PART_CONTENT_MAX.toLocaleString()} characters (${trimmed.length.toLocaleString()}/${STORY_LIMITS.PART_CONTENT_MAX.toLocaleString()}).`,
      longestParagraphLength: trimmed.length,
      paragraphCount: 1,
    };
  }

  // Paragraphs are naturally separated by newlines (\r?\n+)
  const rawParagraphs = content.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
  const paragraphCount = rawParagraphs.length;
  let longestParagraphLength = 0;

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    if (p.length > longestParagraphLength) {
      longestParagraphLength = p.length;
    }
    if (p.length > STORY_LIMITS.PARAGRAPH_MAX) {
      return {
        isValid: false,
        error: `Paragraph ${i + 1} is too long (${p.length}/${STORY_LIMITS.PARAGRAPH_MAX} characters). Please insert a line break to divide it into readable paragraphs.`,
        longestParagraphLength,
        paragraphCount,
      };
    }
  }

  return {
    isValid: true,
    longestParagraphLength,
    paragraphCount,
  };
}

export function validatePartCount(currentCount: number): { isValid: boolean; error?: string } {
  if (currentCount >= STORY_LIMITS.MAX_PARTS_PER_SERIES) {
    return {
      isValid: false,
      error: `Series cannot exceed ${STORY_LIMITS.MAX_PARTS_PER_SERIES} parts (${currentCount}/${STORY_LIMITS.MAX_PARTS_PER_SERIES}).`,
    };
  }
  return { isValid: true };
}

/**
 * Estimates reading time in minutes based on average adult reading speed (~200 words/min).
 */
export function estimateReadingMinutes(content: string): number {
  if (!content) return 1;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
