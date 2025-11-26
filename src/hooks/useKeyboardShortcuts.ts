import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
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

export function useGlobalSearchShortcut(onOpen: () => void) {
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      callback: onOpen,
      description: 'Open global search',
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: onOpen,
      description: 'Open global search',
    },
    {
      key: '/',
      callback: onOpen,
      description: 'Focus search',
    },
  ]);
}
