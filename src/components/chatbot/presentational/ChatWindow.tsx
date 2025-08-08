import React from 'react';

interface ChatWindowProps {
  isOpen: boolean;
  onToggle: () => void;
  gradientClass: string;
  loading: boolean;
  children: React.ReactNode;
}

export function ChatWindow({ isOpen, onToggle, gradientClass, loading, children }: ChatWindowProps) {
  return (
    <aside aria-label="Chat window" role="complementary" className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <section
          id="chat-panel"
          role="region"
          aria-live="polite"
          aria-busy={loading}
          className="w-[360px] max-h-[70vh] rounded-xl shadow-lg overflow-hidden mb-2"
        >
          <div className={`h-2 ${gradientClass}`} />
          <div className="bg-background border border-border rounded-b-xl">
            {children}
          </div>
        </section>
      )}
      <button
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        onClick={onToggle}
        className="rounded-full border bg-background px-2 py-1 text-xs"
      >
        {isOpen ? 'Minimize' : 'Chat'}
      </button>
    </aside>
  );
}
