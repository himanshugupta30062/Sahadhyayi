import { describe, expect, it } from 'vitest';
import {
  getBookOverallQualityScore,
  compareLibraryBooks,
} from '@/hooks/useLibraryBooks';

const baseBook = {
  id: 'complete-book',
  title: 'Godan',
  author: 'Munshi Premchand',
  language: 'Hindi',
  publication_year: 1936,
  isbn: '978812670 ನಿರ',
  pages: 320,
  genre: 'Hindi Fiction',
  description: 'A detailed synopsis describing the social and economic struggles of Indian farmers.',
  cover_image_url: 'https://cdn.example.org/godan-cover.webp',
  created_at: '2025-01-01T00:00:00Z',
};

describe('overall book correctness ranking', () => {
  it('rewards complete bibliographic identity, cover and verified reading access', () => {
    const verified = {
      ...baseBook,
      pdf_url: 'https://cdn.example.org/godan.pdf',
      reader_link_status: 'working',
      reader_link_http_status: 200,
      reader_link_content_type: 'application/pdf',
      metadata_match_score: 100,
      pdf_quality_score: 100,
      asset_quality_score: 100,
      asset_quality_status: 'verified',
      cover_quality_score: 95,
    };
    const metadataOnly = { ...baseBook, cover_quality_score: 60 };
    expect(getBookOverallQualityScore(verified)).toBeGreaterThan(
      getBookOverallQualityScore(metadataOnly),
    );
  });

  it('does not treat a pending direct PDF as verified access', () => {
    const pending = {
      ...baseBook,
      pdf_url: 'https://cdn.example.org/godan.pdf',
      reader_link_status: 'unchecked',
      asset_quality_status: 'pending',
    };
    const metadataOnly = { ...baseBook };
    expect(getBookOverallQualityScore(pending)).toBeGreaterThan(
      getBookOverallQualityScore(metadataOnly),
    );
    expect(getBookOverallQualityScore(pending)).toBeLessThan(100);
  });

  it('penalizes failed asset verification and poor metadata matching', () => {
    const trusted = {
      ...baseBook,
      pdf_url: 'https://cdn.example.org/godan.pdf',
      reader_link_status: 'working',
      reader_link_http_status: 200,
      reader_link_content_type: 'application/pdf',
      metadata_match_score: 95,
      pdf_quality_score: 95,
      asset_quality_status: 'verified',
      asset_quality_score: 95,
    };
    const incorrect = {
      ...trusted,
      metadata_match_score: 10,
      pdf_quality_score: 20,
      asset_quality_status: 'failed',
    };
    expect(getBookOverallQualityScore(trusted)).toBeGreaterThan(
      getBookOverallQualityScore(incorrect),
    );
    expect(compareLibraryBooks(trusted, incorrect)).toBeLessThan(0);
  });

  it('keeps scores bounded and handles missing measurements', () => {
    expect(getBookOverallQualityScore({ title: 'A Book', author: 'An Author' })).toBeGreaterThanOrEqual(0);
    expect(getBookOverallQualityScore({ title: 'A Book', author: 'An Author' })).toBeLessThanOrEqual(100);
  });
});
