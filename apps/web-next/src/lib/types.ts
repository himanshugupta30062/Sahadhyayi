import { z } from 'zod';

export const languageSchema = z.union([z.literal('HI'), z.literal('EN')]);
export type Language = z.infer<typeof languageSchema>;

export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  photo_url: z.string().url().nullable().optional(),
});
export type Author = z.infer<typeof authorSchema>;

export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_hi: z.string().optional(),
  author_ids: z.array(z.string()),
  genres: z.array(z.string()),
  tags: z.array(z.string()),
  language: languageSchema,
  year: z.number().int().optional(),
  cost: z.number().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  file_url: z.string().url().nullable().optional(),
  popularity: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  authors: z.array(authorSchema).optional(),
});
export type Book = z.infer<typeof bookSchema>;

export type SortOption = 'newest' | 'popularity' | 'az' | 'za';

export interface GetBooksParams {
  q?: string;
  genres?: string[];
  language?: Language;
  price?: 'free' | 'paid';
  yearRange?: [number | undefined, number | undefined];
  sort?: SortOption;
  cursor?: string;
}
