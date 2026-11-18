import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import StreakBonus, { StreakPopup } from './StreakBonus';

vi.mock('framer-motion', async () => {
  const ReactModule = await import('react');
  const MotionDiv = ReactModule.forwardRef<any, any>((props, ref) => {
    const { initial, animate, exit, transition, ...domProps } = props;
    return ReactModule.createElement('div', { ...domProps, ref }, props.children);
  });
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: any) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

describe('StreakBonus', () => {
  afterEach(() => cleanup());

  it('does not render a badge before a two-answer streak', () => {
    const { container } = render(<StreakBonus streak={1} multiplier={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    [2, 'STREAK'],
    [3, 'NICE!'],
    [5, 'AMAZING!'],
    [7, 'ON FIRE!'],
    [10, 'UNSTOPPABLE!'],
  ])('shows the correct label for a %i-answer streak', (streak, label) => {
    render(<StreakBonus streak={streak} multiplier={2} showAnimation />);

    expect(screen.getByText(String(streak))).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('omits the multiplier chip when the multiplier is one', () => {
    render(<StreakBonus streak={2} multiplier={1} />);
    expect(screen.getByText('STREAK')).toBeInTheDocument();
    expect(screen.queryByText('1x')).not.toBeInTheDocument();
  });
});

describe('StreakPopup', () => {
  afterEach(() => cleanup());

  it('does not render below the first milestone', () => {
    const { container } = render(<StreakPopup streak={2} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    [3, 'Great!', '👍'],
    [5, 'Awesome!', '🔥'],
    [7, 'Incredible!', '⚡'],
    [10, 'LEGENDARY!', '👑'],
  ])('shows the %s popup at streak %i', (streak, message, emoji) => {
    render(<StreakPopup streak={streak} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText(`${streak} in a row!`)).toBeInTheDocument();
    expect(screen.getByText(emoji)).toBeInTheDocument();
  });
});
