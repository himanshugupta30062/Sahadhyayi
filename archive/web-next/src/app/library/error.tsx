'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4 text-center">
      <p>Failed to load library.</p>
      <button
        onClick={reset}
        className="mt-2 rounded border px-3 py-1"
      >
        Try again
      </button>
    </div>
  );
}
