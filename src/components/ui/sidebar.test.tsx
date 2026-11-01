// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

afterEach(() => {
  cleanup();
});

const renderSidebar = (defaultOpen = true) => render(
  <SidebarProvider defaultOpen={defaultOpen}>
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Library</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
    <SidebarTrigger />
  </SidebarProvider>
);

describe('sidebar accessibility and state', () => {
  it('exposes the current expanded state through its accessible trigger', () => {
    const { container } = renderSidebar();
    const trigger = screen.getByRole('button', { name: /toggle sidebar/i });
    const sidebar = container.querySelector('.group.peer');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    expect(screen.getByRole('button', { name: 'Library' })).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    expect(sidebar).toHaveAttribute('data-collapsible', 'offcanvas');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
  });

  it('supports the documented Ctrl+B keyboard shortcut and keeps state accessible', () => {
    renderSidebar(false);
    const trigger = screen.getByRole('button', { name: /toggle sidebar/i });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not expose an expanded sidebar when it starts collapsed', () => {
    const { container } = renderSidebar(false);
    const trigger = screen.getByRole('button', { name: /toggle sidebar/i });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.group.peer')).toHaveAttribute('data-state', 'collapsed');
  });
});
