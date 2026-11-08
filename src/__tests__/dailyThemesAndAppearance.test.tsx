/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import {
  getDailyThemeForDayIndex,
  getTodayDailyTheme,
  DAILY_THEMES,
  DAILY_THEMES_ORDERED,
} from '@/config/dailyThemes';
import { AppearanceSettingsCard } from '@/components/profile/AppearanceSettingsCard';

// Component to inspect ThemeContext in tests
const ThemeStateInspector: React.FC = () => {
  const {
    theme,
    mode,
    activeDailyTheme,
    resolvedTheme,
    setMode,
    setCustomTheme,
    resetToDailyTheme,
    toggleTheme,
  } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="mode">{mode}</span>
      <span data-testid="active-daily-theme">{activeDailyTheme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setMode('daily')} data-testid="btn-mode-daily">Daily</button>
      <button onClick={() => setMode('light')} data-testid="btn-mode-light">Light</button>
      <button onClick={() => setMode('dark')} data-testid="btn-mode-dark">Dark</button>
      <button onClick={() => setMode('custom')} data-testid="btn-mode-custom">Custom</button>
      <button onClick={() => setCustomTheme('lavender')} data-testid="btn-custom-lavender">Lavender</button>
      <button onClick={() => setCustomTheme('mint')} data-testid="btn-custom-mint">Mint</button>
      <button onClick={resetToDailyTheme} data-testid="btn-reset-daily">Reset</button>
      <button onClick={toggleTheme} data-testid="btn-toggle">Toggle</button>
    </div>
  );
};

describe('7 Daily Themes Resolution Engine', () => {
  it('resolves correct daily themes for every day of the week', () => {
    // 0 = Sunday
    expect(getDailyThemeForDayIndex(0)).toBe('cream');
    expect(DAILY_THEMES.sunday.name).toContain('Ivory');

    // 1 = Monday
    expect(getDailyThemeForDayIndex(1)).toBe('pure-white');
    expect(DAILY_THEMES.monday.name).toBe('Pure White');

    // 2 = Tuesday
    expect(getDailyThemeForDayIndex(2)).toBe('lavender');
    expect(DAILY_THEMES.tuesday.name).toBe('Soft Lavender');

    // 3 = Wednesday
    expect(getDailyThemeForDayIndex(3)).toBe('mint');
    expect(DAILY_THEMES.wednesday.name).toBe('Mint Green');

    // 4 = Thursday
    expect(getDailyThemeForDayIndex(4)).toBe('warm-yellow');
    expect(DAILY_THEMES.thursday.name).toBe('Warm Yellow');

    // 5 = Friday
    expect(getDailyThemeForDayIndex(5)).toBe('soft-pink');
    expect(DAILY_THEMES.friday.name).toBe('Soft Pink');

    // 6 = Saturday
    expect(getDailyThemeForDayIndex(6)).toBe('sky-blue');
    expect(DAILY_THEMES.saturday.name).toBe('Sky Blue');
  });

  it('orders all 7 daily themes correctly from Sunday through Saturday', () => {
    expect(DAILY_THEMES_ORDERED.length).toBe(7);
    expect(DAILY_THEMES_ORDERED.map((t) => t.id)).toEqual([
      'cream',
      'pure-white',
      'lavender',
      'mint',
      'warm-yellow',
      'soft-pink',
      'sky-blue',
    ]);
  });
});

describe('ThemeContext Dynamic Day & Preference Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes in daily mode with today’s local day theme applied to DOM root', () => {
    const today = getTodayDailyTheme();

    render(
      <ThemeProvider>
        <ThemeStateInspector />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('daily');
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('active-daily-theme').textContent).toBe(today);
    expect(screen.getByTestId('resolved-theme').textContent).toBe(today);

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains(`theme-${today}`)).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe(today);
  });

  it('switches between Daily, Light, Dark, and Custom modes and updates DOM attributes', () => {
    render(
      <ThemeProvider>
        <ThemeStateInspector />
      </ThemeProvider>
    );

    // Switch to Light (Pure White)
    fireEvent.click(screen.getByTestId('btn-mode-light'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('active-daily-theme').textContent).toBe('pure-white');
    expect(document.documentElement.getAttribute('data-theme')).toBe('pure-white');
    expect(document.documentElement.classList.contains('theme-pure-white')).toBe(true);

    // Switch to Dark
    fireEvent.click(screen.getByTestId('btn-mode-dark'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Switch to Custom (Lavender)
    fireEvent.click(screen.getByTestId('btn-custom-lavender'));
    expect(screen.getByTestId('mode').textContent).toBe('custom');
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('active-daily-theme').textContent).toBe('lavender');
    expect(document.documentElement.getAttribute('data-theme')).toBe('lavender');
    expect(document.documentElement.classList.contains('theme-lavender')).toBe(true);

    // Reset to Daily
    fireEvent.click(screen.getByTestId('btn-reset-daily'));
    expect(screen.getByTestId('mode').textContent).toBe('daily');
    const today = getTodayDailyTheme();
    expect(screen.getByTestId('active-daily-theme').textContent).toBe(today);
  });

  it('persists preferences to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeStateInspector />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('btn-custom-mint'));
    const stored = JSON.parse(localStorage.getItem('sahadhyayi-theme-preference') || '{}');
    expect(stored.mode).toBe('custom');
    expect(stored.customTheme).toBe('mint');
    expect(localStorage.getItem('sahadhyayi-theme')).toBe('light');
  });
});

describe('AppearanceSettingsCard Profile Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all four theme modes and seven daily swatches', () => {
    render(
      <ThemeProvider>
        <AppearanceSettingsCard />
      </ThemeProvider>
    );

    expect(screen.getByText('Appearance & Themes')).toBeInTheDocument();
    expect(screen.getByText('Daily Dynamic')).toBeInTheDocument();
    expect(screen.getAllByText('Pure White').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    expect(screen.getByText('Custom Theme')).toBeInTheDocument();

    // Verify all 7 themes are listed
    expect(screen.getByText('Soft Lavender')).toBeInTheDocument();
    expect(screen.getByText('Mint Green')).toBeInTheDocument();
    expect(screen.getByText('Warm Yellow')).toBeInTheDocument();
    expect(screen.getByText('Soft Pink')).toBeInTheDocument();
    expect(screen.getByText('Sky Blue')).toBeInTheDocument();
    expect(screen.getByText('Warm Ivory & Cream')).toBeInTheDocument();
  });

  it('allows clicking a daily theme swatch to apply custom theme', () => {
    render(
      <ThemeProvider>
        <AppearanceSettingsCard />
      </ThemeProvider>
    );

    const lavenderSwatch = screen.getByText('Soft Lavender').closest('button');
    expect(lavenderSwatch).toBeInTheDocument();
    if (lavenderSwatch) {
      fireEvent.click(lavenderSwatch);
    }

    expect(document.documentElement.getAttribute('data-theme')).toBe('lavender');
  });
});
