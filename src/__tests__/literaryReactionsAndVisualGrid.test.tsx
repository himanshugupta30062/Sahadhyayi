/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  LITERARY_REACTIONS,
  LiteraryReactionType,
} from '@/hooks/useSocialPostReactions';
import { LiteraryReactionPicker } from '@/components/social/LiteraryReactionPicker';

// Mocks
const mockMutate = vi.fn();
vi.mock('@/hooks/useSocialPostReactions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useSocialPostReactions')>();
  return {
    ...actual,
    useTogglePostReaction: () => ({
      mutate: mockMutate,
      isPending: false,
    }),
  };
});

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'reader-user-1', email: 'reader@example.com' },
  }),
}));

describe('Literary Reactions & Visual Grid (Social Hybrid Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('LITERARY_REACTIONS metadata', () => {
    it('defines 6 literary reaction types with appropriate emojis and descriptions', () => {
      const keys = Object.keys(LITERARY_REACTIONS) as LiteraryReactionType[];
      expect(keys).toEqual([
        'loved',
        'insightful',
        'devastating',
        'cozy',
        'unputdownable',
        'thought_provoking',
      ]);

      expect(LITERARY_REACTIONS.loved.emoji).toBe('❤️');
      expect(LITERARY_REACTIONS.insightful.emoji).toBe('💡');
      expect(LITERARY_REACTIONS.devastating.emoji).toBe('💔');
      expect(LITERARY_REACTIONS.cozy.emoji).toBe('☕');
      expect(LITERARY_REACTIONS.unputdownable.emoji).toBe('🔥');
      expect(LITERARY_REACTIONS.thought_provoking.emoji).toBe('🤔');
    });
  });

  describe('LiteraryReactionPicker component', () => {
    it('renders default button when no reaction is set', () => {
      render(
        <LiteraryReactionPicker
          postId="post-1"
          legacyLikesCount={4}
          userLikedLegacy={false}
        />
      );

      const button = screen.getByRole('button', { name: /like post, 4 likes/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('renders user active reaction and aggregates correctly', () => {
      render(
        <LiteraryReactionPicker
          postId="post-1"
          reactionSummary={{
            user_reaction: 'insightful',
            counts: { insightful: 3, cozy: 2 },
            total: 5,
          }}
        />
      );

      // Main button reflects "Insightful"
      expect(screen.getByText('Insightful')).toBeInTheDocument();
      const lightbulbs = screen.getAllByText('💡');
      expect(lightbulbs.length).toBeGreaterThanOrEqual(1);

      // Aggregate pills reflect 💡 3 and ☕ 2
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('triggers toggleReaction mutation when a reaction pill is clicked', () => {
      render(
        <LiteraryReactionPicker
          postId="post-1"
          reactionSummary={{
            user_reaction: null,
            counts: { cozy: 4 },
            total: 4,
          }}
        />
      );

      const cozyPill = screen.getByTitle(/4 readers felt this was Cozy Read/i);
      fireEvent.click(cozyPill);

      expect(mockMutate).toHaveBeenCalledWith({
        postId: 'post-1',
        reactionType: 'cozy',
      });
    });

    it('triggers default loved reaction when unreacted primary button is clicked', () => {
      render(
        <LiteraryReactionPicker
          postId="post-2"
          legacyLikesCount={0}
          userLikedLegacy={false}
        />
      );

      const button = screen.getByRole('button', { name: /like post, 0 likes/i });
      fireEvent.click(button);

      expect(mockMutate).toHaveBeenCalledWith({
        postId: 'post-2',
        reactionType: 'loved',
      });
    });
  });
});
