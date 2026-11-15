import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';

describe('Resizable UI', () => {
  it('renders ResizablePanelGroup, panels, and handle with grip icon', () => {
    const { container } = render(
      <ResizablePanelGroup direction="horizontal" className="custom-group">
        <ResizablePanel defaultSize={50}>Left Content</ResizablePanel>
        <ResizableHandle withHandle className="custom-handle" />
        <ResizablePanel defaultSize={50}>Right Content</ResizablePanel>
      </ResizablePanelGroup>
    );

    expect(container.querySelector('.custom-group')).toBeInTheDocument();
    expect(container.querySelector('.custom-handle')).toBeInTheDocument();
    expect(container.textContent).toContain('Left Content');
    expect(container.textContent).toContain('Right Content');
  });
});
