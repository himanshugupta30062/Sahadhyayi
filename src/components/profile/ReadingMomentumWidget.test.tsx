// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReadingMomentumWidget from './ReadingMomentumWidget';

describe('ReadingMomentumWidget', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders streak, days this week, and goal percentage', () => {
    render(
      <BrowserRouter>
        <ReadingMomentumWidget
          currentStreakDays={5}
          completedThisYear={6}
          annualTarget={12}
          recentCompleted={[]}
          readingLogs={[]}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Reading Momentum')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('6 / 12 books')).toBeInTheDocument();
  });
});
