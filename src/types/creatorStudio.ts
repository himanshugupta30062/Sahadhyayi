export type AspectRatio = 'square' | 'portrait' | 'story';

export type TemplateStyle =
  | 'minimalist_editorial'
  | 'dark_academia'
  | 'pastel_aesthetic'
  | 'vintage_library'
  | 'indian_heritage'
  | 'bold_pop';

export type PostType =
  | 'review'
  | 'quote'
  | 'wrapup'
  | 'tbr'
  | 'versus'
  | 'custom';

export interface SlideData {
  id: string;
  slideNumber: number;
  // Core Book Metadata
  bookId?: string;
  bookTitle?: string;
  author?: string;
  coverImageUrl?: string;
  genre?: string;
  pageCount?: number;
  publicationYear?: number;
  
  // Content specifics
  rating: number; // 0 - 5
  hookLine?: string; // E.g. "The book that redefined historical fiction."
  reviewBody?: string;
  quote?: string;
  quoteAttribution?: string; // Chapter, page, or character
  vibe?: string; // E.g. "Melancholic, Atmospheric, Poetic"
  tags: string[]; // E.g. ["Must Read", "5 Stars", "Book Club Pick"]
  
  // Custom styling overrides if any
  customHeadline?: string;
  customSubtitle?: string;
  customBody?: string;
}

export interface CreatorPostState {
  id?: string;
  postType: PostType;
  aspectRatio: AspectRatio;
  templateId: TemplateStyle;
  slides: SlideData[];
  activeSlideIndex: number;
  brandWatermarkEnabled: boolean;
  brandWatermarkText: string;
  caption: string;
  hashtags: string[];
}

export interface TemplateDefinition {
  id: TemplateStyle;
  name: string;
  description: string;
  badge: string;
  previewColor: string;
  textColor: string;
  accentColor: string;
  containerClass: string;
  badgeClass: string;
  fontDisplayClass: string;
  fontBodyClass: string;
  tagClass: string;
}

export const ASPECT_RATIO_CONFIG: Record<
  AspectRatio,
  { label: string; ratio: string; width: number; height: number; displayAspect: string }
> = {
  square: {
    label: '1:1 Square (Feed)',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    displayAspect: 'aspect-square',
  },
  portrait: {
    label: '4:5 Portrait (Recommended)',
    ratio: '4:5',
    width: 1080,
    height: 1350,
    displayAspect: 'aspect-[4/5]',
  },
  story: {
    label: '9:16 Story / Reel',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    displayAspect: 'aspect-[9/16]',
  },
};

export const TEMPLATE_DEFINITIONS: Record<TemplateStyle, TemplateDefinition> = {
  minimalist_editorial: {
    id: 'minimalist_editorial',
    name: 'Minimalist Editorial',
    description: 'Crisp typography, clean whitespace, refined elegance.',
    badge: 'Editorial',
    previewColor: '#FDFCFA',
    textColor: '#18181B',
    accentColor: '#18181B',
    containerClass: 'bg-[#FDFCFA] text-[#18181B] border-[#E4E4E7]',
    badgeClass: 'bg-[#18181B] text-[#FDFCFA]',
    fontDisplayClass: 'font-serif tracking-tight',
    fontBodyClass: 'font-sans',
    tagClass: 'bg-[#F4F4F5] text-[#27272A] border-[#E4E4E7]',
  },
  dark_academia: {
    id: 'dark_academia',
    name: 'Dark Academia',
    description: 'Moody espresso tones, gold accents, vintage scholar aesthetic.',
    badge: 'Moody & Rich',
    previewColor: '#181513',
    textColor: '#E8E2D9',
    accentColor: '#D4AF37',
    containerClass: 'bg-[#181513] text-[#E8E2D9] border-[#3A332C]',
    badgeClass: 'bg-[#D4AF37]/20 text-[#F1D88A] border border-[#D4AF37]/40',
    fontDisplayClass: 'font-serif tracking-wide',
    fontBodyClass: 'font-serif',
    tagClass: 'bg-[#26201B] text-[#D8CFBF] border-[#3A332C]',
  },
  pastel_aesthetic: {
    id: 'pastel_aesthetic',
    name: 'Pastel Aesthetic',
    description: 'Soft sunset gradients, contemporary chic, gentle curves.',
    badge: 'Aesthetic',
    previewColor: '#FFF1F2',
    textColor: '#334155',
    accentColor: '#8B5CF6',
    containerClass: 'bg-gradient-to-br from-[#FFF1F2] via-[#F5F3FF] to-[#EFF6FF] text-[#334155] border-pink-200/60',
    badgeClass: 'bg-violet-600 text-white shadow-sm',
    fontDisplayClass: 'font-sans font-bold tracking-tight',
    fontBodyClass: 'font-sans',
    tagClass: 'bg-white/80 backdrop-blur-sm text-violet-800 border-violet-100',
  },
  vintage_library: {
    id: 'vintage_library',
    name: 'Vintage Library',
    description: 'Aged parchment, sepia ink, bookplate elegance.',
    badge: 'Classic Parchment',
    previewColor: '#F4ECE1',
    textColor: '#2C221E',
    accentColor: '#8C2D19',
    containerClass: 'bg-[#F4ECE1] text-[#2C221E] border-[#D4C3A3]',
    badgeClass: 'bg-[#8C2D19] text-[#F4ECE1]',
    fontDisplayClass: 'font-serif italic font-semibold',
    fontBodyClass: 'font-serif',
    tagClass: 'bg-[#E8DCC8] text-[#3F3029] border-[#D4C3A3]',
  },
  indian_heritage: {
    id: 'indian_heritage',
    name: 'Indian Heritage',
    description: 'Warm terracotta, saffron, indigo royal hues & Indic harmony.',
    badge: 'Desi Literary',
    previewColor: '#FAF4EB',
    textColor: '#2D1E12',
    accentColor: '#C2410C',
    containerClass: 'bg-[#FAF4EB] text-[#2D1E12] border-[#E8D4BE]',
    badgeClass: 'bg-[#C2410C] text-[#FAF4EB]',
    fontDisplayClass: 'font-serif font-bold tracking-wide',
    fontBodyClass: 'font-sans',
    tagClass: 'bg-[#F2E4D2] text-[#78350F] border-[#E2CEB7]',
  },
  bold_pop: {
    id: 'bold_pop',
    name: 'Bold Pop',
    description: 'High contrast, neon rose accents, punchy contemporary feel.',
    badge: 'Pop Modern',
    previewColor: '#0F172A',
    textColor: '#F8FAFC',
    accentColor: '#F43F5E',
    containerClass: 'bg-[#0F172A] text-[#F8FAFC] border-[#334155]',
    badgeClass: 'bg-[#F43F5E] text-white font-extrabold uppercase tracking-wider',
    fontDisplayClass: 'font-sans font-black tracking-tighter',
    fontBodyClass: 'font-sans',
    tagClass: 'bg-[#1E293B] text-[#F43F5E] border-[#334155] font-semibold',
  },
};
