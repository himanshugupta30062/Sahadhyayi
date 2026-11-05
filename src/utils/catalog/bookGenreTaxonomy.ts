/**
 * Canonical Library taxonomy. Keep labels stable across inconsistent provider metadata.
 * Unknown metadata is not guessed from a title alone.
 */
export const BOOK_GENRE_TAXONOMY = [
  'Fiction', 'Literary Fiction', 'Fantasy', 'Science Fiction', 'Mystery & Thriller',
  'Romance', 'Horror', 'Historical Fiction', 'Poetry', 'Drama', 'Non-Fiction',
  'Biography & Memoir', 'History', 'Philosophy', 'Psychology', 'Self-Help',
  'Religion & Spirituality', 'Politics & Society', 'Economics & Business', 'Science',
  'Technology & Engineering', 'Education', 'Health & Medicine', 'Travel',
  'Art & Photography', 'Comics & Graphic Novels', 'Children & Young Adult',
  'Reference', 'Academic & Research', 'Other',
] as const;

const aliases: Record<string, string> = {
  novel: 'Fiction', novels: 'Fiction', fiction: 'Fiction', 'general fiction': 'Fiction',
  'literary fiction': 'Literary Fiction', classics: 'Literary Fiction', classic: 'Literary Fiction',
  fantasy: 'Fantasy', 'science fiction': 'Science Fiction', 'sci-fi': 'Science Fiction', 'sci fi': 'Science Fiction',
  scifi: 'Science Fiction', 'speculative fiction': 'Science Fiction',
  thriller: 'Mystery & Thriller', thrillers: 'Mystery & Thriller', mystery: 'Mystery & Thriller', 'detective fiction': 'Mystery & Thriller',
  crime: 'Mystery & Thriller', detective: 'Mystery & Thriller',
  romance: 'Romance', romantic: 'Romance', horror: 'Horror',
  'historical novel': 'Historical Fiction', 'historical fiction': 'Historical Fiction',
  poetry: 'Poetry', poems: 'Poetry', drama: 'Drama', plays: 'Drama',
  nonfiction: 'Non-Fiction', 'non-fiction': 'Non-Fiction', 'non fiction': 'Non-Fiction',
  biography: 'Biography & Memoir', biographies: 'Biography & Memoir', memoir: 'Biography & Memoir',
  autobiography: 'Biography & Memoir', history: 'History', philosophy: 'Philosophy',
  psychology: 'Psychology', 'self help': 'Self-Help', 'self-help': 'Self-Help',
  religion: 'Religion & Spirituality', spirituality: 'Religion & Spirituality',
  politics: 'Politics & Society', sociology: 'Politics & Society', society: 'Politics & Society',
  economics: 'Economics & Business', business: 'Economics & Business', finance: 'Economics & Business',
  science: 'Science', mathematics: 'Science', biology: 'Science', physics: 'Science',
  technology: 'Technology & Engineering', engineering: 'Technology & Engineering',
  education: 'Education', teaching: 'Education', medicine: 'Health & Medicine',
  health: 'Health & Medicine', travel: 'Travel', photography: 'Art & Photography',
  art: 'Art & Photography', comics: 'Comics & Graphic Novels', manga: 'Comics & Graphic Novels',
  'graphic novels': 'Comics & Graphic Novels', children: 'Children & Young Adult',
  juvenile: 'Children & Young Adult', 'young adult': 'Children & Young Adult',
  reference: 'Reference', textbook: 'Academic & Research', academic: 'Academic & Research',
  research: 'Academic & Research',
};

const key = (value: string) => value.trim().toLowerCase().replace(/[_]+/g, ' ').replace(/\s+/g, ' ');

export function normalizeBookGenre(value?: string | null): string {
  if (!value?.trim()) return 'Other';
  const hierarchy = value.split('/').map(key).filter(Boolean);
  for (const part of hierarchy.reverse()) if (aliases[part]) return aliases[part];
  const normalized = key(value);
  if (aliases[normalized]) return aliases[normalized];
  const exact = BOOK_GENRE_TAXONOMY.find((genre) => key(genre) === normalized);
  if (exact) return exact;
  const parts = normalized.split(/[;,|]/).map((part) => part.trim()).filter(Boolean);
  for (const part of parts) if (aliases[part]) return aliases[part];
  return 'Other';
}

export function normalizeBookGenres(values?: string[] | string | null): string[] {
  const list = Array.isArray(values) ? values : values ? values.split(/[;,|]/) : [];
  return [...new Set(list.map(normalizeBookGenre).filter((genre) => genre !== 'Other'))];
}
