export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 animate-pulse">
      <div className="h-8 w-1/2 rounded bg-gray-200" />
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="h-10 w-full rounded bg-gray-200" />
    </div>
  );
}
