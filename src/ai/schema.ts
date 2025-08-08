import { z } from 'zod';

export const AiResponseSchema = z.object({
  reply: z.string().min(1).max(1200),
  references: z.array(z.object({
    bookId: z.string().optional(),
    title: z.string().optional()
  })).max(5),
  followup: z.string().optional()
});

export type AiResponseParsed = z.infer<typeof AiResponseSchema>;
