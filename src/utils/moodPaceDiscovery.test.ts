import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateMoodMatch,
  evaluatePaceMatch,
  evaluateContentWarnings,
  filterAndRankBooks,
  saveDiscoveryPreferences,
  loadSavedDiscoveryPreferences,
  clearSavedDiscoveryPreferences,
  DISCOVERY_MOODS,
  BookExperienceSummary,
} from './moodPaceDiscovery';

describe('moodPaceDiscovery Utility', () => {
  describe('evaluateMoodMatch', () => {
    it('returns matches true when no mood is selected', () => {
      const res = evaluateMoodMatch({ title: 'Sample' }, [], null);
      expect(res.matches).toBe(true);
      expect(res.scoreBoost).toBe(0);
    });

    it('matches community tag with high priority and explainable reason', () => {
      const res = evaluateMoodMatch(
        { title: 'The Hobbit', description: 'A quiet journey' },
        ['comforting'],
        'comforting'
      );
      expect(res.matches).toBe(true);
      expect(res.type).toBe('community');
      expect(res.scoreBoost).toBe(100);
      expect(res.reason).toContain('Reader community tagged');
    });

    it('infers mood from synopsis keywords when community tag is absent', () => {
      const res = evaluateMoodMatch(
        { title: 'Little Tea Shop', description: 'A cozy heartwarming tale of friendship', genre: 'Fiction' },
        [],
        'comforting'
      );
      expect(res.matches).toBe(true);
      expect(res.type).toBe('inferred');
      expect(res.scoreBoost).toBe(45);
      expect(res.reason).toContain('Inferred vibe from genre & synopsis');
      expect(res.reason).toContain('cozy');
    });

    it('returns matches false when book does not align with selected mood', () => {
      const res = evaluateMoodMatch(
        { title: 'Linear Algebra', description: 'Vector spaces and matrices', genre: 'Mathematics' },
        [],
        'romantic'
      );
      expect(res.matches).toBe(false);
      expect(res.scoreBoost).toBe(0);
    });
  });

  describe('evaluatePaceMatch', () => {
    it('matches all when pace is "all"', () => {
      expect(evaluatePaceMatch(150, null, 'all').matches).toBe(true);
      expect(evaluatePaceMatch(null, null, 'all').matches).toBe(true);
    });

    it('correctly categorizes page count into short, medium, and long', () => {
      // Short: <= 220
      expect(evaluatePaceMatch(180, null, 'short').matches).toBe(true);
      expect(evaluatePaceMatch(250, null, 'short').matches).toBe(false);

      // Medium: 221-420
      expect(evaluatePaceMatch(300, null, 'medium').matches).toBe(true);
      expect(evaluatePaceMatch(150, null, 'medium').matches).toBe(false);
      expect(evaluatePaceMatch(500, null, 'medium').matches).toBe(false);

      // Long: > 420
      expect(evaluatePaceMatch(550, null, 'long').matches).toBe(true);
      expect(evaluatePaceMatch(350, null, 'long').matches).toBe(false);
    });

    it('uses community pacing when available', () => {
      expect(evaluatePaceMatch(null, 'fast', 'short').matches).toBe(true);
      expect(evaluatePaceMatch(null, 'slow', 'long').matches).toBe(true);
      expect(evaluatePaceMatch(null, 'medium', 'medium').matches).toBe(true);
    });

    it('handles unknown length gracefully based on includeUnknownLength toggle', () => {
      // Default: include unknown
      const incl = evaluatePaceMatch(null, null, 'short', true);
      expect(incl.matches).toBe(true);
      expect(incl.source).toBe('unknown');

      // Strict mode: exclude unknown
      const strict = evaluatePaceMatch(null, null, 'short', false);
      expect(strict.matches).toBe(false);
      expect(strict.source).toBe('unknown');
    });
  });

  describe('evaluateContentWarnings', () => {
    it('excludes books when reported warnings match user hidden preferences', () => {
      const res = evaluateContentWarnings(['violence', 'grief'], {
        hiddenWarnings: ['violence'],
        strictUnknown: false,
      });
      expect(res.isExcluded).toBe(true);
      expect(res.status).toBe('reported');
      expect(res.reason).toContain('violence');
    });

    it('keeps books without matching warnings', () => {
      const res = evaluateContentWarnings(['death'], {
        hiddenWarnings: ['war', 'abuse'],
        strictUnknown: false,
      });
      expect(res.isExcluded).toBe(false);
      expect(res.status).toBe('reported');
    });

    it('handles unreviewed books according to strictUnknown flag', () => {
      // Standard: do not exclude unreviewed books
      const standard = evaluateContentWarnings([], {
        hiddenWarnings: ['violence'],
        strictUnknown: false,
      });
      expect(standard.isExcluded).toBe(false);
      expect(standard.status).toBe('unreviewed');

      // Strict mode: exclude unreviewed books if user demands guaranteed safety
      const strict = evaluateContentWarnings([], {
        hiddenWarnings: ['violence'],
        strictUnknown: true,
      });
      expect(strict.isExcluded).toBe(true);
      expect(strict.status).toBe('unreviewed');
    });
  });

  describe('filterAndRankBooks integration', () => {
    const sampleBooks = [
      {
        id: 'b1',
        title: 'Warm Hearth Tales',
        author: 'Sarah Wood',
        genre: 'Fiction',
        description: 'A cozy heartwarming story of a quiet village.',
        pages: 180,
        pdf_url: 'https://example.com/b1.pdf',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'b2',
        title: 'Grim Shadows',
        author: 'Victor Kane',
        genre: 'Horror',
        description: 'A dark and gritty descent into gothic horrors and violence.',
        pages: 450,
        created_at: '2026-02-01T00:00:00Z',
      },
      {
        id: 'b3',
        title: 'Unknown Length Odyssey',
        author: 'Alex River',
        genre: 'Sci-Fi',
        description: 'An epic adventure across stars.',
        pages: undefined,
        created_at: '2026-03-01T00:00:00Z',
      },
    ];

    const expMap = new Map<string, BookExperienceSummary>([
      [
        'b2',
        {
          book_id: 'b2',
          moods: ['dark'],
          pacing: 'slow',
          content_warnings: ['violence'],
          community_tags_count: 5,
        },
      ],
    ]);

    it('filters by mood, ranking community tags above inferred', () => {
      const res = filterAndRankBooks(
        sampleBooks,
        {
          selectedMood: 'comforting',
          paceFilter: 'all',
          includeUnknownLength: true,
          contentWarnings: { hiddenWarnings: [], strictUnknown: false },
          genreFilter: 'all',
          languageFilter: 'all',
          availabilityFilter: 'all',
          searchQuery: '',
        },
        expMap
      );

      expect(res).toHaveLength(1);
      expect(res[0].book.id).toBe('b1');
      expect(res[0].moodMatch?.type).toBe('inferred');
    });

    it('excludes books when user specifies content warning', () => {
      const res = filterAndRankBooks(
        sampleBooks,
        {
          selectedMood: null,
          paceFilter: 'all',
          includeUnknownLength: true,
          contentWarnings: { hiddenWarnings: ['violence'], strictUnknown: false },
          genreFilter: 'all',
          languageFilter: 'all',
          availabilityFilter: 'all',
          searchQuery: '',
        },
        expMap
      );

      expect(res.map((r) => r.book.id)).not.toContain('b2');
    });

    it('combines pace filter and unknown length settings', () => {
      // Short with unknown length allowed -> b1 and b3
      const resWithUnknown = filterAndRankBooks(
        sampleBooks,
        {
          selectedMood: null,
          paceFilter: 'short',
          includeUnknownLength: true,
          contentWarnings: { hiddenWarnings: [], strictUnknown: false },
          genreFilter: 'all',
          languageFilter: 'all',
          availabilityFilter: 'all',
          searchQuery: '',
        },
        expMap
      );
      expect(resWithUnknown.map((r) => r.book.id)).toEqual(['b1', 'b3']);

      // Short with unknown length disallowed -> b1 only
      const resStrict = filterAndRankBooks(
        sampleBooks,
        {
          selectedMood: null,
          paceFilter: 'short',
          includeUnknownLength: false,
          contentWarnings: { hiddenWarnings: [], strictUnknown: false },
          genreFilter: 'all',
          languageFilter: 'all',
          availabilityFilter: 'all',
          searchQuery: '',
        },
        expMap
      );
      expect(resStrict.map((r) => r.book.id)).toEqual(['b1']);
    });
  });

  describe('Discovery Preferences Persistence', () => {
    beforeEach(() => {
      clearSavedDiscoveryPreferences();
    });

    it('persists preferences only when user gives consent', () => {
      saveDiscoveryPreferences({
        selectedMood: 'comforting',
        paceFilter: 'short',
        includeUnknownLength: true,
        contentWarnings: { hiddenWarnings: ['violence'], strictUnknown: false },
        consentGiven: true,
      });

      const loaded = loadSavedDiscoveryPreferences();
      expect(loaded).not.toBeNull();
      expect(loaded?.selectedMood).toBe('comforting');
      expect(loaded?.paceFilter).toBe('short');
      expect(loaded?.contentWarnings.hiddenWarnings).toEqual(['violence']);
    });

    it('does not save or removes preferences when consent is not given', () => {
      saveDiscoveryPreferences({
        selectedMood: 'dark',
        paceFilter: 'long',
        includeUnknownLength: false,
        contentWarnings: { hiddenWarnings: [], strictUnknown: false },
        consentGiven: false,
      });

      expect(loadSavedDiscoveryPreferences()).toBeNull();
    });
  });
});
