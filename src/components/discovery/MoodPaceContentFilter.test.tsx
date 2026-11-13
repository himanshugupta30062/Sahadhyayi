/** @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoodPaceContentFilter from './MoodPaceContentFilter';

describe('MoodPaceContentFilter Component', () => {
  const defaultProps = {
    selectedMood: null,
    onSelectMood: vi.fn(),
    paceFilter: 'all' as const,
    onChangePace: vi.fn(),
    includeUnknownLength: true,
    onToggleIncludeUnknownLength: vi.fn(),
    contentWarnings: { hiddenWarnings: [], strictUnknown: false },
    onChangeContentWarnings: vi.fn(),
    hasActiveFilters: false,
    onClearFilters: vi.fn(),
    isPreferencesSaved: false,
    onSavePreferences: vi.fn(),
    onClearPreferences: vi.fn(),
  };

  it('renders all mood chips and handles selection', () => {
    const onSelectMood = vi.fn();
    render(<MoodPaceContentFilter {...defaultProps} onSelectMood={onSelectMood} />);

    // Check mood label exists
    expect(screen.getByText(/Reading Mood & Vibe/i)).toBeInTheDocument();

    // Find Comforting & Cozy button
    const comfortingBtn = screen.getByRole('button', { name: /Comforting & Cozy/i });
    expect(comfortingBtn).toBeInTheDocument();
    expect(comfortingBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(comfortingBtn);
    expect(onSelectMood).toHaveBeenCalledWith('comforting');
  });

  it('toggles mood off when already selected', () => {
    const onSelectMood = vi.fn();
    render(
      <MoodPaceContentFilter
        {...defaultProps}
        selectedMood="comforting"
        onSelectMood={onSelectMood}
      />
    );

    const comfortingBtn = screen.getByRole('button', { name: /Comforting & Cozy/i });
    expect(comfortingBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(comfortingBtn);
    expect(onSelectMood).toHaveBeenCalledWith(null);
  });

  it('handles pace button selection', () => {
    const onChangePace = vi.fn();
    render(<MoodPaceContentFilter {...defaultProps} onChangePace={onChangePace} />);

    const quickReadBtn = screen.getByRole('button', { name: /Quick read/i });
    fireEvent.click(quickReadBtn);
    expect(onChangePace).toHaveBeenCalledWith('short');
  });

  it('toggles unknown length switch', () => {
    const onToggle = vi.fn();
    render(
      <MoodPaceContentFilter
        {...defaultProps}
        includeUnknownLength={true}
        onToggleIncludeUnknownLength={onToggle}
      />
    );

    const toggle = screen.getByRole('switch', { name: /Include books without page count/i });
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('expands content warning safety panel and toggles exclusions', () => {
    const onChangeWarnings = vi.fn();
    render(
      <MoodPaceContentFilter
        {...defaultProps}
        onChangeContentWarnings={onChangeWarnings}
      />
    );

    // Expand panel
    const expandBtn = screen.getByRole('button', { name: /Configure excluded topics/i });
    fireEvent.click(expandBtn);

    // Click Violence exclusion (use exact regex to distinguish from "sexual violence")
    const violenceBtn = screen.getByRole('button', { name: /^violence$/i });
    fireEvent.click(violenceBtn);

    expect(onChangeWarnings).toHaveBeenCalledWith({
      hiddenWarnings: ['violence'],
      strictUnknown: false,
    });
  });

  it('prompts consent modal before saving preferences', () => {
    const onSave = vi.fn();
    render(<MoodPaceContentFilter {...defaultProps} onSavePreferences={onSave} />);

    const saveTrigger = screen.getByRole('button', { name: /Save these preferences/i });
    fireEvent.click(saveTrigger);

    // Consent dialog should now be visible
    expect(screen.getByText(/Save discovery preferences on this device\?/i)).toBeInTheDocument();
    expect(screen.getByText(/never used to infer sensitive personal traits/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Save/i });
    fireEvent.click(confirmBtn);

    expect(onSave).toHaveBeenCalled();
  });
});
