import { SlideData, PostType, CaptionTone } from '@/types/creatorStudio';

export interface CaptionGenerationParams {
  postType: PostType;
  tone: CaptionTone;
  slide: SlideData;
  brandHandle?: string;
}

/**
 * Builds grounded hashtags based on book metadata and tropes.
 */
export function generateSmartHashtags(slide: SlideData): string[] {
  const tags = new Set<string>();

  // Core Bookstagram hashtags
  tags.add('#Bookstagram');
  tags.add('#BookstagramIndia');
  tags.add('#ReadersOfInstagram');
  tags.add('#BookReview');
  tags.add('#Sahadhyayi');

  if (slide.rating === 5) {
    tags.add('#5StarRead');
    tags.add('#MustRead');
  } else if (slide.rating >= 4) {
    tags.add('#HighlyRecommended');
  }

  // Genre based tags
  const genreLower = (slide.genre || '').toLowerCase();
  if (genreLower.includes('classic')) {
    tags.add('#ClassicLiterature');
    tags.add('#VintageReads');
  } else if (genreLower.includes('fiction')) {
    tags.add('#FictionReads');
    tags.add('#LiteraryFiction');
  } else if (genreLower.includes('history') || genreLower.includes('historical')) {
    tags.add('#HistoricalFiction');
    tags.add('#HistoryBuff');
  } else if (genreLower.includes('science') || genreLower.includes('philosophy')) {
    tags.add('#PhilosophyBooks');
    tags.add('#DeepReads');
  } else if (genreLower.includes('poetry')) {
    tags.add('#PoetryOfInstagram');
    tags.add('#PoetryLovers');
  }

  // User tags
  if (slide.tags && Array.isArray(slide.tags)) {
    slide.tags.forEach((t) => {
      const clean = t.replace(/[^a-zA-Z0-9]/g, '');
      if (clean) tags.add(`#${clean}`);
    });
  }

  return Array.from(tags).slice(0, 16);
}

/**
 * Generates an engaging, grounded Bookstagram caption.
 */
export function generateGroundedCaption(params: CaptionGenerationParams): string {
  const { postType, tone, slide, brandHandle } = params;
  const title = slide.bookTitle || 'this book';
  const author = slide.author ? `by ${slide.author}` : '';
  const stars = slide.rating > 0 ? '★'.repeat(slide.rating) : '';
  const hook = slide.hookLine ? `\n\n"${slide.hookLine}"` : '';

  if (postType === 'quote') {
    const quote = slide.quote || 'There is no friend as loyal as a book.';
    const attr = slide.quoteAttribution ? ` (${slide.quoteAttribution})` : '';

    if (tone === 'bilingual') {
      return `Kuch panktियां dil ko chhu jaati hain... ✨\n\n“${quote}”\n— ${slide.author || 'Author'}${attr}\n\nFrom "${title}".\n\nAapka is quote ke baare mein kya kehna hai? Let me know in the comments! 📖`;
    }

    if (tone === 'poetic') {
      return `Words that linger long after the final page is turned.\n\n“${quote}”\n— ${slide.author || 'Author'}${attr}\n\nExquisite passage from "${title}". What's a line that completely stopped you in your tracks lately? 🍂✨`;
    }

    if (tone === 'casual') {
      return `I just had to stop and re-read this sentence three times! 😍\n\n“${quote}”\n— ${slide.author || 'Author'}${attr}\n\nHave you read "${title}" yet? What did you think? 👇`;
    }

    // Default: thoughtful
    return `A passage that resonates with quiet brilliance:\n\n“${quote}”\n— ${slide.author || 'Author'}${attr}\n\nFrom "${title}". Books give shape to thoughts we never knew how to utter. What book gave you that feeling recently?`;
  }

  if (postType === 'tbr') {
    return `Stacking up the next literary adventures! 📚✨\n\nOn the TBR:\n1. ${title} ${author}\n\nWhich of these should I prioritize first? What's at the top of your reading stack right now?`;
  }

  if (postType === 'wrapup') {
    return `Monthly Reading Recap 📊📖\n\nAnother month of turning pages, traveling through eras, and discovering unforgettable stories. Top pick this month: "${title}" ${stars}\n\nHow many books did you read this month? Share your favorites!`;
  }

  // Default: Book Review
  if (tone === 'bilingual') {
    return `Aaj baat karte hain ek aisi kitaab ki jisne sach mein sochne par majboor kar diya — "${title}" ${author}.${hook}\n\nRating: ${stars || '5/5'}\n\n${slide.reviewBody || 'Prose bahut sundar hai aur characters ki journey dil ko chhoo leti hai.'}\n\nKya aapne ye kitaab padhi hai? Apne thoughts comments mein zaroor share karein! 📖✨`;
  }

  if (tone === 'poetic') {
    return `Some stories don't just entertain; they echo in the quiet corners of your mind. "${title}" ${author}.${hook}\n\nRating: ${stars}\n\n${slide.reviewBody || 'A haunting, luminous work that explores human fragility and grace with quiet mastery.'}\n\nHave you wandered through this world yet? Tell me your thoughts below. 🌙`;
  }

  if (tone === 'casual') {
    return `Okay, we NEED to talk about "${title}" ${author}! 🤩${hook}\n\nMy rating: ${stars || '★★★★★'}\n\n${slide.reviewBody || 'I finished this in record time because I could not put it down. The pacing and characters were phenomenal!'}\n\nDrop your thoughts in the comments — did you love it or were you divided? 👇`;
  }

  // Default: thoughtful
  return `Finished reading "${title}" ${author}.${hook}\n\nRating: ${stars}\n\n${slide.reviewBody || 'A richly textured narrative that balances nuanced character dynamics with resonant thematic depth. Highly recommended for thoughtful readers.'}\n\nWho else has read this? What stood out most to you? 📚${brandHandle ? `\n\n— ${brandHandle}` : ''}`;
}
