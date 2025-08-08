export function ChatHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-3 py-2 border-b">
      <div className="font-semibold">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
