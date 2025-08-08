export function Loader({ label = 'Thinking…' }: { label?: string }) {
  return <div className="p-2 text-xs text-muted-foreground">{label}</div>;
}
