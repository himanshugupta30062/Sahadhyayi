import React from 'react';

interface ChatWindowProps {
  isOpen: boolean;
  onToggle: () => void;
  gradientClass: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function ChatWindow({ isOpen, onToggle, gradientClass, children, loading }: ChatWindowProps) {
  return (
    <aside
      aria-label="Chat window"
      role="complementary"
      className={`fixed bottom-6 right-6 z-50 w-[360px] max-h-[70vh] rounded-xl shadow-lg overflow-hidden ${isOpen ? '' : 'pointer-events-none opacity-0'}`}
    >
      <div className={`h-2 ${gradientClass}`} />
      <section
        id="chat-panel"
        role="region"
        aria-live="polite"
        aria-busy={loading}
        className="bg-background border border-border rounded-b-xl"
      >
        {children}
      </section>
      <button
        aria-label={isOpen ? 'Minimize chat' : 'Open chat'}
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        onClick={onToggle}
        className="absolute -top-3 right-3 rounded-full border bg-background px-2 py-1 text-xs"
      >
        {isOpen ? '—' : 'Chat'}
      </button>
    </aside>
  );
}
