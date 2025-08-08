import React from 'react';

interface ChatWindowProps {
  isOpen: boolean;
  onToggle: () => void;
  gradientClass: string;
  children: React.ReactNode;
}

export function ChatWindow({ isOpen, onToggle, gradientClass, children }: ChatWindowProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[360px] max-h-[70vh] rounded-xl shadow-lg overflow-hidden ${isOpen ? '' : 'pointer-events-none opacity-0'}`}>
      <div className={`h-2 ${gradientClass}`} />
      <div className="bg-background border border-border rounded-b-xl">
        {children}
      </div>
      <button
        aria-label={isOpen ? 'Minimize chat' : 'Open chat'}
        onClick={onToggle}
        className="absolute -top-3 right-3 rounded-full border bg-background px-2 py-1 text-xs"
      >
        {isOpen ? '—' : 'Chat'}
      </button>
    </div>
  );
}
