import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RichTextToolbar from './RichTextToolbar';

describe('RichTextToolbar', () => {
  it('triggers onInsert for inline formatting buttons and onWrapLines for headings', () => {
    const onInsert = vi.fn();
    const onWrapLines = vi.fn();
    const ref = React.createRef<HTMLTextAreaElement>();

    const { container } = render(
      <RichTextToolbar
        textareaRef={ref}
        onInsert={onInsert}
        onWrapLines={onWrapLines}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Click Bold button (index 0)
    fireEvent.click(buttons[0]);
    expect(onInsert).toHaveBeenCalledWith('**', '**', 'bold text');

    // Click Heading 1 button (index 2)
    fireEvent.click(buttons[2]);
    expect(onWrapLines).toHaveBeenCalledWith('# ');
  });
});
