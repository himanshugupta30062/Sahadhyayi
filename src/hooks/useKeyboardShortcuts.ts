import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
  allowInInputs?: boolean;
}

/**
 * Checks if the user is running on macOS or iOS
 */
export function isApplePlatform(): boolean {
  if (typeof window === 'undefined') return true;
  const platform =
    (navigator as any)?.userAgentData?.platform ||
    navigator?.platform ||
    navigator?.userAgent ||
    '';
  return /Mac|iPhone|iPod|iPad/i.test(platform);
}

/**
 * Returns OS-appropriate search shortcut labels for UI presentation
 */
export function getSearchShortcutLabel(): { display: string; key: string; symbol: string } {
  const isMac = isApplePlatform();
  return {
    display: isMac ? '⌘K' : 'Ctrl+K',
    key: isMac ? '⌘' : 'Ctrl',
    symbol: 'K',
  };
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement | null;
      const isInput =
        Boolean(target) &&
        (target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable);

      for (const shortcut of shortcuts) {
        if (isInput && !shortcut.allowInInputs) {
          continue;
        }

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, enabled]);
}

/**
 * Global keyboard listener for Universal Search palette (Cmd+K / Ctrl+K and '/')
 * - Works anywhere on the page, even if an input is focused (e.g. toggles search from any field)
 * - Toggles the search palette open or closed
 * - Does not trigger '/' if the user is typing in an input
 */
export function useGlobalSearchShortcut(onToggle: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isK = event.key === 'k' || event.key === 'K';
      const isModifierK = isK && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;

      if (isModifierK) {
        // If the event was prevented by another handler (e.g. custom markdown link editor in ArticleWrite), respect it
        if (event.defaultPrevented) return;

        event.preventDefault();
        onToggle();
        return;
      }

      // Single slash shortcut only when NOT typing in an editable field
      const target = event.target as HTMLElement | null;
      const isEditable =
        Boolean(target) &&
        (target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable);

      if (!isEditable && event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle, enabled]);
}
