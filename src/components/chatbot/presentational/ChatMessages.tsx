export interface ChatMsg { id: string; role: 'user'|'assistant'|'system'; content: string; }
export function ChatMessages({ messages }: { messages: ChatMsg[] }) {
  return (
    <div className="p-3 space-y-2 overflow-y-auto max-h-[50vh]">
      {messages.map(m => (
        <div key={m.id} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
          <div className={`inline-block rounded px-2 py-1 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
