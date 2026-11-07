export const STORY_LIMITS = {
  STORY_TITLE_MAX: 100,
  STORY_DESCRIPTION_MAX: 500,
  PART_TITLE_MAX: 150,
  PART_CONTENT_MAX: 5000,
  PARAGRAPH_MAX: 500,
  MAX_PARTS_PER_SERIES: 30,
  MAX_TAGS: 5,
} as const;

export const STORY_GENRES = [
  'General',
  'Fiction',
  'Historical',
  'Mystery & Thriller',
  'Romance',
  'Sci-Fi & Fantasy',
  'Philosophical',
  'Mythology & Folklore',
  'Slice of Life',
  'Poetry & Prose',
  'Memoir & Personal',
  'Horror',
] as const;

export type StoryGenre = typeof STORY_GENRES[number];
