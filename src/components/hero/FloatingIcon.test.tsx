import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { BookOpen } from 'lucide-react';
import { FloatingIcon } from '@/components/hero/FloatingIcon';

describe('FloatingIcon', () => {
  afterEach(() => cleanup());

  it('renders icon with specified position, size, and delay', () => {
    const { container } = render(
      <FloatingIcon
        Icon={BookOpen}
        position={{ top: '10px', left: '20px' }}
        color="text-primary"
        delay={1.5}
        size={40}
      />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.style.top).toBe('10px');
    expect(root.style.left).toBe('20px');
    expect(root.style.width).toBe('40px');
    expect(root.style.height).toBe('40px');
    expect(root.style.animationDelay).toBe('1.5s');

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains('text-primary')).toBe(true);
  });
});
