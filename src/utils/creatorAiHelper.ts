import { supabase } from '@/integrations/supabase/client-universal';
import { generateGroundedCaption } from './creatorCaptionHelper';
import { SlideData, PostType, CaptionTone } from '@/types/creatorStudio';

export interface AiCaptionRequest {
  postType: PostType;
  tone: CaptionTone;
  slide: SlideData;
  brandHandle?: string;
}

/**
 * Invokes the Supabase Edge Function 'generate-share-caption' powered by Gemini
 * with automatic fallback to the grounded local template engine.
 */
export async function generateContextualAiCaption(
  params: AiCaptionRequest
): Promise<{ caption: string; isAiGenerated: boolean }> {
  const { tone, slide, brandHandle } = params;
  const title = slide.bookTitle || 'Book Review';
  const author = slide.author ? `by ${slide.author}` : '';
  const notes = slide.reviewBody || slide.quote || slide.hookLine || '';

  // Only call AI if user has provided at least a book title or note
  if (slide.bookTitle || notes) {
    try {
      const promptContent = `Book Title: ${title} ${author}
User Star Rating: ${slide.rating > 0 ? `${slide.rating}/5` : 'Unrated'}
User's Real Review / Highlights: "${notes}"
Desired Tone: ${tone} (e.g. thoughtful/literary, conversational, poetic, or bilingual Hinglish)
Selected Tropes / Tags: ${slide.tags?.join(', ') || 'None'}
Creator Watermark: ${brandHandle || ''}

Important rule: Ground your caption ONLY in the details and impressions provided by the user above. Do NOT fabricate unread plot twists or fake ratings.`;

      const { data, error } = await supabase.functions.invoke('generate-share-caption', {
        body: {
          platform: 'instagram',
          title,
          subtitle: author,
          content: promptContent,
        },
      });

      if (!error && data?.caption && typeof data.caption === 'string' && data.caption.trim()) {
        return { caption: data.caption.trim(), isAiGenerated: true };
      }
    } catch (err) {
      console.warn('AI caption call failed, using grounded template engine:', err);
    }
  }

  // Grounded fallback
  const fallback = generateGroundedCaption(params);
  return { caption: fallback, isAiGenerated: false };
}
