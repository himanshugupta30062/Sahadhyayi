import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { AtomShell } from '@/components/hero/AtomShell';
import { ATOM_MATERIALS } from '@/components/hero/AtomMaterials';

describe('AtomShell', () => {
  afterEach(() => cleanup());

  it('renders with letter and applies material styles', () => {
    render(
      <AtomShell
        material={ATOM_MATERIALS.library}
        letter="S"
        isHovered={false}
        size={50}
      />
    );

    const span = screen.getByText('S');
    expect(span).toBeInTheDocument();
  });

  it('scales up and applies glow when hovered', () => {
    const { container } = render(
      <AtomShell
        material={ATOM_MATERIALS.author}
        letter="A"
        isHovered={true}
        size={60}
      />
    );

    const innerDiv = container.querySelector('span')?.parentElement;
    expect(innerDiv).toBeInTheDocument();
    expect(innerDiv?.style.transform).toBe('scale(1.15)');
  });
});
