// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import GameModeSelector, { DailyChallenges } from './GameModeSelector';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GameModeSelector', () => {
  it('renders all supported modes and their rules', () => {
    render(<GameModeSelector selectedMode="classic" onSelectMode={vi.fn()} />);

    expect(screen.getByText('Classic Quiz')).toBeInTheDocument();
    expect(screen.getByText('Answer 10 questions with a 30-second timer')).toBeInTheDocument();
    expect(screen.getByText('Speed Run')).toBeInTheDocument();
    expect(screen.getByText('Survival Mode')).toBeInTheDocument();
    expect(screen.getByText('Challenge Mode')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it.each([
    ['Classic Quiz', 'classic'],
    ['Speed Run', 'speed'],
    ['Survival Mode', 'survival'],
  ] as const)('selects %s when its card is clicked', (label, mode) => {
    const onSelectMode = vi.fn();
    render(<GameModeSelector selectedMode="classic" onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByText(label));
    expect(onSelectMode).toHaveBeenCalledWith(mode);
  });

  it('keeps the preview challenge disabled and does not select it', () => {
    const onSelectMode = vi.fn();
    render(<GameModeSelector selectedMode="classic" onSelectMode={onSelectMode} />);

    fireEvent.click(screen.getByText('Challenge Mode'));
    expect(onSelectMode).not.toHaveBeenCalled();
  });

  it('marks the selected mode and displays its selection indicator', () => {
    const { container } = render(<GameModeSelector selectedMode="survival" onSelectMode={vi.fn()} />);

    const selectedCard = screen.getByText('Survival Mode').closest('[class*="ring-2"]');
    expect(selectedCard).not.toBeNull();
    expect(container.querySelectorAll('.ring-2')).toHaveLength(1);
  });
});

describe('DailyChallenges', () => {
  it('labels illustrative challenges as previews and clearly says they are coming soon', () => {
    render(<DailyChallenges />);

    expect(screen.getByText('Daily Challenges')).toBeInTheDocument();
    expect(screen.getByText('Speed Demon')).toBeInTheDocument();
    expect(screen.getByText('Perfect Run')).toBeInTheDocument();
    expect(screen.getByText('Fire Streak')).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(3);
    expect(screen.getAllByText('Preview').length).toBeGreaterThanOrEqual(4);
  });
});
