'use client';

interface Props {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function Paginator({ hasPrev, hasNext, onPrev, onNext }: Props) {
  return (
    <div className="mt-4 flex justify-center gap-4">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="rounded border px-3 py-1 disabled:opacity-50"
        aria-label="Previous page"
      >
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="rounded border px-3 py-1 disabled:opacity-50"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}
