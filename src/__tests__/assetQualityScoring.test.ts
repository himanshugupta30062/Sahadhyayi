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

  it('only adds ranking points for persisted verified evidence', () => {
    expect(getVerifiedAssetRankingBonus({ asset_quality_status: 'pending', asset_quality_score: 99 })).toBe(0);
    expect(getVerifiedAssetRankingBonus({ asset_quality_status: 'verified', asset_quality_score: 80 })).toBe(160);
  });
});
