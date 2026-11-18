/**
 * Evidence-backed asset quality scoring.
 * A URL alone never earns verification points. Scores are null until a verifier
 * records HTTP, format, parse/render and identity evidence.
 */
export interface AssetVerificationEvidence {
  checkedAt?: string;
  verifierVersion?: number;
  cover?: {
    checked: boolean;
    reachable?: boolean;
    contentType?: string;
    width?: number;
    height?: number;
    byteSize?: number;
    decodable?: boolean;
    blankOrPlaceholder?: boolean;
    duplicateOfBookId?: string | null;
    titleMatch?: number;
    authorMatch?: number;
    warnings?: string[];
  };
  pdf?: {
    checked: boolean;
    reachable?: boolean;
    contentType?: string;
    signatureValid?: boolean;
    parseable?: boolean;
    pageCount?: number;
    textExtractable?: boolean;
    encrypted?: boolean;
    titleMatch?: number;
    authorMatch?: number;
    warnings?: string[];
  };
  metadata?: { titleMatch?: number; authorMatch?: number; isbnMatch?: boolean };
}

export interface AssetQualityScores {
  cover: number | null;
  pdf: number | null;
  metadataMatch: number | null;
  overall: number | null;
  status: 'pending' | 'verified' | 'needs_review' | 'failed';
  evidence: AssetVerificationEvidence;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const mean = (values: number[]) => values.length ? clamp(values.reduce((a, b) => a + b, 0) / values.length) : null;

export function scoreCoverEvidence(e: AssetVerificationEvidence['cover']): number | null {
  if (!e?.checked) return null;
  if (!e.reachable || !e.decodable || e.blankOrPlaceholder || e.duplicateOfBookId) return 0;
  let score = 35;
  if (e.contentType?.startsWith('image/')) score += 10;
  if ((e.width || 0) >= 300 && (e.height || 0) >= 450) score += 15;
  else if ((e.width || 0) >= 150 && (e.height || 0) >= 225) score += 7;
  if ((e.byteSize || 0) >= 12_000) score += 10;
  if (typeof e.titleMatch === 'number') score += clamp(e.titleMatch) * 0.2;
  if (typeof e.authorMatch === 'number') score += clamp(e.authorMatch) * 0.1;
  return clamp(score);
}

export function scorePdfEvidence(e: AssetVerificationEvidence['pdf']): number | null {
  if (!e?.checked) return null;
  if (!e.reachable || !e.signatureValid || !e.parseable || e.encrypted) return 0;
  let score = 35;
  if (e.contentType === 'application/pdf') score += 10;
  if ((e.pageCount || 0) >= 10) score += 15;
  else if ((e.pageCount || 0) > 0) score += 5;
  if (e.textExtractable) score += 10;
  if (typeof e.titleMatch === 'number') score += clamp(e.titleMatch) * 0.2;
  if (typeof e.authorMatch === 'number') score += clamp(e.authorMatch) * 0.1;
  return clamp(score);
}

export function calculateAssetQualityScores(evidence: AssetVerificationEvidence): AssetQualityScores {
  const cover = scoreCoverEvidence(evidence.cover);
  const pdf = scorePdfEvidence(evidence.pdf);
  const metadataMatch = evidence.metadata
    ? mean([
        ...(typeof evidence.metadata.titleMatch === 'number' ? [evidence.metadata.titleMatch] : []),
        ...(typeof evidence.metadata.authorMatch === 'number' ? [evidence.metadata.authorMatch] : []),
        ...(typeof evidence.metadata.isbnMatch === 'boolean' ? [evidence.metadata.isbnMatch ? 100 : 0] : []),
      ])
    : null;
  const available = [cover, pdf, metadataMatch].filter((v): v is number => v !== null);
  const overall = mean(available);
  const checkedCount = Number(Boolean(evidence.cover?.checked)) + Number(Boolean(evidence.pdf?.checked));
  const failed = (cover === 0 && evidence.cover?.checked) || (pdf === 0 && evidence.pdf?.checked);
  // A successful HTTP/parse check is not enough: verification also requires\n  // strong cover + PDF identity evidence and an independent metadata match.\n  const meetsVerificationThreshold =\n    cover !== null && cover >= 75 &&\n    pdf !== null && pdf >= 75 &&\n    metadataMatch !== null && metadataMatch >= 75;\n  const status = !checkedCount\n    ? 'pending'\n    : failed\n      ? 'failed'\n      : meetsVerificationThreshold\n        ? 'verified'\n        : 'needs_review';
  return { cover, pdf, metadataMatch, overall, status, evidence };
}

/** Ranking bonus is only applied to verifier-backed records, never URL heuristics. */
export function getVerifiedAssetRankingBonus(book: {
  asset_quality_status?: string;
  asset_quality_score?: number | null;
}): number {
  if (book.asset_quality_status !== 'verified' || typeof book.asset_quality_score !== 'number') return 0;
  return Math.round(clamp(book.asset_quality_score) * 2); // 0–200, stays inside a ranking tier.
}
