import { toSeoDescription } from '@/utils/seoText';

interface AdaptationSeoInput {
  id: string; bookTitle: string; bookAuthor?: string | null;
  bookPublicationYear?: number | string | null; bookCoverUrl?: string | null;
  bookLibraryId?: string | null; bookSynopsis?: string | null;
  movieTitle: string; movieReleaseYear?: number | string | null;
  moviePosterUrl?: string | null; movieSynopsis?: string | null;
}
const absoluteHttpUrl = (value?: string | null) =>
  value && /^https?:\/\//i.test(value) ? value : undefined;

export function buildAdaptationSeoMetadata(input: AdaptationSeoInput) {
  const canonical = `https://sahadhyayi.com/from-page-to-screen/${encodeURIComponent(input.id)}`;
  const title = `${input.bookTitle} vs ${input.movieTitle} | Book and Movie Comparison | Sahadhyayi`;
  const description = toSeoDescription(input.bookSynopsis || input.movieSynopsis ||
    `Compare ${input.bookTitle}${input.bookAuthor ? ` by ${input.bookAuthor}` : ''} with its screen adaptation ${input.movieTitle}. Explore story changes, character portrayals and differences between the book and movie.`);
  const image = absoluteHttpUrl(input.bookCoverUrl) || absoluteHttpUrl(input.moviePosterUrl);
  const bookId = `${canonical}#book`;
  const movieId = `${canonical}#movie`;
  const bookSchema: Record<string, unknown> = {
    '@type': 'Book', '@id': bookId, name: input.bookTitle,
    url: input.bookLibraryId ? `https://sahadhyayi.com/book/${encodeURIComponent(input.bookLibraryId)}` : canonical,
    ...(input.bookAuthor ? { author: { '@type': 'Person', name: input.bookAuthor } } : {}),
    ...(input.bookPublicationYear ? { datePublished: String(input.bookPublicationYear) } : {}),
    ...(absoluteHttpUrl(input.bookCoverUrl) ? { image: input.bookCoverUrl } : {}),
  };
  const movieSchema: Record<string, unknown> = {
    '@type': 'Movie', '@id': movieId, name: input.movieTitle, url: canonical,
    isBasedOn: bookSchema,
    ...(input.movieReleaseYear ? { datePublished: String(input.movieReleaseYear) } : {}),
    ...(absoluteHttpUrl(input.moviePosterUrl) ? { image: input.moviePosterUrl } : {}),
  };
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage', '@id': canonical, url: canonical, name: title, description,
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    mainEntity: movieSchema,
  };
  return {
    title, description, canonical, image, schema,
    breadcrumbs: [
      { name: 'Home', url: 'https://sahadhyayi.com/' },
      { name: 'From Page to Screen', url: 'https://sahadhyayi.com/from-page-to-screen' },
      { name: input.bookTitle, url: canonical },
    ],
  };
}
