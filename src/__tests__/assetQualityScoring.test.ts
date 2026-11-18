import { describe, expect, it } from 'vitest';
import {
  calculateAssetQualityScores,
  getVerifiedAssetRankingBonus,
  scoreCoverEvidence,
  scorePdfEvidence,
} from '@/utils/catalog/assetQualityScoring';

describe('asset quality scoring', () => {
  it('does not score an unchecked cover or PDF as verified', () => {
    expect(scoreCoverEvidence(undefined)).toBeNull();
    expect(scorePdfEvidence(undefined)).toBeNull();
    expect(calculateAssetQualityScores({}).status).toBe('pending');
  });

  it('rejects unreachable, placeholder and undecodable covers', () => {
    expect(scoreCoverEvidence({ checked: true, reachable: false, decodable: false })).toBe(0);
    expect(scoreCoverEvidence({ checked: true, reachable: true, decodable: true, blankOrPlaceholder: true })).toBe(0);
  });

  it('scores a high-resolution matched cover using recorded evidence', () => {
    const score = scoreCoverEvidence({
      checked: true, reachable: true, decodable: true, contentType: 'image/jpeg',
      width: 800, height: 1200, byteSize: 90000, titleMatch: 100, authorMatch: 100,
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('requires valid signature and parseability for a quality PDF score', () => {
    expect(scorePdfEvidence({ checked: true, reachable: true, signatureValid: false, parseable: false })).toBe(0);
    expect(scorePdfEvidence({
      checked: true, reachable: true, signatureValid: true, parseable: true,
      contentType: 'application/pdf', pageCount: 120, textExtractable: true,
      titleMatch: 100, authorMatch: 100,
    })).toBe(100);
  });

  it('does not call reachable but weakly matched assets verified', () => {
    const weakEvidence = calculateAssetQualityScores({
      cover: { checked: true, reachable: true, decodable: true, contentType: 'image/jpeg', width: 800, height: 1200, byteSize: 90000, titleMatch: 20, authorMatch: 20 },
      pdf: { checked: true, reachable: true, signatureValid: true, parseable: true, contentType: 'application/pdf', pageCount: 120, textExtractable: true, titleMatch: 20, authorMatch: 20 },
      metadata: { titleMatch: 20, authorMatch: 20, isbnMatch: false },
    });
    expect(weakEvidence.status).toBe('needs_review');
  });

  it('requires cover, PDF and independent metadata identity evidence to verify', () => {
    const strongAssetsWithoutMetadata = calculateAssetQualityScores({
      cover: { checked: true, reachable: true, decodable: true, contentType: 'image/jpeg', width: 800, height: 1200, byteSize: 90000, titleMatch: 100, authorMatch: 100 },
      pdf: { checked: true, reachable: true, signatureValid: true, parseable: true, contentType: 'application/pdf', pageCount: 120, textExtractable: true, titleMatch: 100, authorMatch: 100 },
    });
    expect(strongAssetsWithoutMetadata.status).toBe('needs_review');

    const verified = calculateAssetQualityScores({
      cover: { checked: true, reachable: true, decodable: true, contentType: 'image/jpeg', width: 800, height: 1200, byteSize: 90000, titleMatch: 100, authorMatch: 100 },
      pdf: { checked: true, reachable: true, signatureValid: true, parseable: true, contentType: 'application/pdf', pageCount: 120, textExtractable: true, titleMatch: 100, authorMatch: 100 },
      metadata: { titleMatch: 100, authorMatch: 100, isbnMatch: true },
    });
    expect(verified.status).toBe('verified');
  });

  it('marks rejected asset evidence as failed instead of verified', () => {
    const failed = calculateAssetQualityScores({
      cover: { checked: true, reachable: false, decodable: false },
      pdf: { checked: true, reachable: true, signatureValid: true, parseable: true, pageCount: 10 },
    });
    expect(failed.status).toBe('failed');
  });

  it('only adds ranking points for persisted verified evidence', () => {
    expect(getVerifiedAssetRankingBonus({ asset_quality_status: 'pending', asset_quality_score: 99 })).toBe(0);
    expect(getVerifiedAssetRankingBonus({ asset_quality_status: 'verified', asset_quality_score: 80 })).toBe(160);
  });
});
