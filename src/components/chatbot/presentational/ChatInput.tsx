import React from 'react';
export function ChatInput({
  value, onChange, onSend, disabled, rightSlot
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 p-2 border-t">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
        placeholder="Ask about books…"
        className="flex-1 rounded border px-2 py-1 outline-none"
        disabled={disabled}
      />
      {rightSlot}
      <button onClick={onSend} disabled={disabled} className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm">
        Send
      </button>
    </div>
  );
}
