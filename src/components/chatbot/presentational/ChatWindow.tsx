import React from 'react';

interface ChatWindowProps {
  isOpen: boolean;
  onToggle: () => void;
  gradientClass: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function ChatWindow({ isOpen, onToggle: _onToggle, gradientClass, children, loading }: ChatWindowProps) {
  return (
    <>
      {isOpen && (
        <aside
          aria-label="Chat window"
          role="complementary"
          className="fixed bottom-16 right-6 z-50 w-[360px] max-h-[70vh] rounded-xl shadow-lg overflow-hidden"
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
        </aside>
      )}
    </>
  );
}
