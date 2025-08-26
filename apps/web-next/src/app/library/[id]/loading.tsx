export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
      <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

