import { DuplicateGroup, DuplicateClassification, MatchConfidence, BookIdentity } from '@/types/bookCatalog';
import { normalizeBookIdentity } from './bookIdentity';

/**
 * Calculates token Jaccard similarity between two strings
 */
function tokenSimilarity(strA: string, strB: string): number {
  const setA = new Set(strA.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(strB.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Checks whether two authors are compatible.
 * Returns true if one contains the other, tokens overlap substantially, or normalized keys match.
 * Returns false if both are defined and distinctly contradictory.
 */
function areAuthorsCompatible(identA: BookIdentity, identB: BookIdentity): boolean {
  if (identA.normalizedAuthorKey === 'unknownauthor' || identB.normalizedAuthorKey === 'unknownauthor') {
    return true; // Unknown author doesn't contradict
  }

  if (identA.normalizedAuthorKey === identB.normalizedAuthorKey) {
    return true;
  }

  // Check token overlap
  const sim = tokenSimilarity(identA.primaryAuthor, identB.primaryAuthor);
  if (sim >= 0.5) return true;

  // Check substring (e.g. "Arthur Conan Doyle" vs "Conan Doyle")
  const a = identA.normalizedAuthorKey;
  const b = identB.normalizedAuthorKey;
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}

/**
 * Checks if two books have matching validated ISBNs
 */
function haveMatchingISBNs(identA: BookIdentity, identB: BookIdentity): boolean {
  if (identA.isbns.length === 0 || identB.isbns.length === 0) return false;
  return identA.isbns.some((isbnA) => identB.isbns.includes(isbnA));
}

/**
 * Checks if two books have matching stable provider identifiers
 */
function haveMatchingProviderIds(identA: BookIdentity, identB: BookIdentity): boolean {
  if (!identA.stableProviderId || !identB.stableProviderId) return false;
  return identA.stableProviderId.toLowerCase() === identB.stableProviderId.toLowerCase();
}

/**
 * Evaluates duplicate relationship between two book identities.
 */
function evaluateRelationship(
  a: BookIdentity,
  b: BookIdentity
): { isMatch: boolean; classification: DuplicateClassification; confidence: MatchConfidence; evidence: string } {
  // 1. Strict Contradiction Gates
  // Gate: Volume mismatch (e.g. Vol 1 vs Vol 2)
  if (a.volumeTag && b.volumeTag && a.volumeTag !== b.volumeTag) {
    return {
      isMatch: false,
      classification: 'distinct_work',
      confidence: 'high',
      evidence: `Different volumes: ${a.volumeTag} vs ${b.volumeTag}`,
    };
  }

  // Gate: Author contradiction
  const authorsCompatible = areAuthorsCompatible(a, b);
  if (!authorsCompatible) {
    return {
      isMatch: false,
      classification: 'distinct_work',
      confidence: 'high',
      evidence: `Different authors: "${a.primaryAuthor}" vs "${b.primaryAuthor}"`,
    };
  }

  // 2. High-Confidence Direct Identity Matches
  // Match via verified ISBN
  if (haveMatchingISBNs(a, b)) {
    const matchingIsbn = a.isbns.find((isbn) => b.isbns.includes(isbn));
    return {
      isMatch: true,
      classification: 'exact_duplicate_edition',
      confidence: 'high',
      evidence: `Exact match on validated ISBN: ${matchingIsbn}`,
    };
  }

  // Match via stable provider ID (e.g. same Project Gutenberg ID)
  if (haveMatchingProviderIds(a, b)) {
    return {
      isMatch: true,
      classification: 'exact_duplicate_edition',
      confidence: 'high',
      evidence: `Exact match on provider ID: ${a.stableProviderId}`,
    };
  }

  // 3. Title & Author Cluster Matching
  const exactTitleKey = a.normalizedTitleKey === b.normalizedTitleKey;
  const titleSim = exactTitleKey ? 1.0 : tokenSimilarity(a.cleanTitle, b.cleanTitle);

  if (exactTitleKey || titleSim >= 0.8) {
    // Check if one is a translation variant
    if (a.language !== b.language || a.isOriginalScript !== b.isOriginalScript) {
      return {
        isMatch: true,
        classification: 'translation_variant',
        confidence: 'high',
        evidence: `Same work in different languages/scripts: ${a.language} vs ${b.language}`,
      };
    }

    // Check if different editions or years
    const hasDifferentYears = a.publicationYear && b.publicationYear && a.publicationYear !== b.publicationYear;
    const hasDifferentEditionTags =
      a.editionTag && b.editionTag && a.editionTag.toLowerCase() !== b.editionTag.toLowerCase();

    if (hasDifferentYears || hasDifferentEditionTags) {
      return {
        isMatch: true,
        classification: 'same_work_different_edition',
        confidence: 'high',
        evidence: `Same work, distinct edition manifestation (${a.editionTag || a.publicationYear || ''} vs ${b.editionTag || b.publicationYear || ''})`,
      };
    }

    // Exact or near-exact match
    return {
      isMatch: true,
      classification: 'exact_duplicate_edition',
      confidence: exactTitleKey ? 'high' : 'medium',
      evidence: `Normalized title and author match ("${a.cleanTitle}" by ${a.primaryAuthor})`,
    };
  }

  // 4. Borderline / Possible Duplicate Review (Title similarity between 0.6 and 0.8 with compatible author)
  if (titleSim >= 0.6 && authorsCompatible && a.primaryAuthor !== 'Unknown Author') {
    return {
      isMatch: true,
      classification: 'possible_duplicate_review',
      confidence: 'low',
      evidence: `Partial title overlap (${Math.round(titleSim * 100)}%) with compatible author`,
    };
  }

  return {
    isMatch: false,
    classification: 'distinct_work',
    confidence: 'high',
    evidence: 'Distinct title and metadata',
  };
}

/**
 * Detects duplicate book groups across an array of raw or normalized books.
 * Groups related records into candidate clusters with classification and evidence.
 */
export function detectDuplicateGroups(books: any[]): DuplicateGroup[] {
  if (!books || books.length === 0) return [];

  const identities: BookIdentity[] = books.map((b) => normalizeBookIdentity(b));
  const visited = new Set<number>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < identities.length; i++) {
    if (visited.has(i)) continue;

    const current = identities[i];
    const groupMembers: BookIdentity[] = [current];
    const groupEvidence: string[] = [];
    let groupClassification: DuplicateClassification = 'exact_duplicate_edition';
    let minConfidence: MatchConfidence = 'high';

    visited.add(i);

    for (let j = i + 1; j < identities.length; j++) {
      if (visited.has(j)) continue;

      const candidate = identities[j];
      const rel = evaluateRelationship(current, candidate);

      if (rel.isMatch) {
        visited.add(j);
        groupMembers.push(candidate);
        if (!groupEvidence.includes(rel.evidence)) {
          groupEvidence.push(rel.evidence);
        }

        // Adjust overall group classification
        if (rel.classification === 'translation_variant') {
          groupClassification = 'translation_variant';
        } else if (
          rel.classification === 'same_work_different_edition' &&
          groupClassification !== 'translation_variant'
        ) {
          groupClassification = 'same_work_different_edition';
        } else if (
          rel.classification === 'possible_duplicate_review' &&
          groupClassification === 'exact_duplicate_edition'
        ) {
          groupClassification = 'possible_duplicate_review';
        }

        if (rel.confidence === 'low') {
          minConfidence = 'low';
        } else if (rel.confidence === 'medium' && minConfidence === 'high') {
          minConfidence = 'medium';
        }
      }
    }

    const groupId = `grp-${current.normalizedTitleKey.slice(0, 16)}-${current.normalizedAuthorKey.slice(0, 12)}-${i}`;
    const clusterKey = `${current.normalizedTitleKey}::${current.normalizedAuthorKey}`;

    groups.push({
      groupId,
      clusterKey,
      classification: groupMembers.length > 1 ? groupClassification : 'distinct_work',
      confidence: groupMembers.length > 1 ? minConfidence : 'high',
      evidence: groupEvidence.length > 0 ? groupEvidence : ['Single unique catalog entry'],
      books: groupMembers.map((m) => m.raw),
    });
  }

  return groups;
}

