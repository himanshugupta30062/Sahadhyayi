'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error;
}

export default function Error({ error }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 text-center">
      <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
      <p className="mb-4">We couldn't load this book. Please try again.</p>
      <button
        onClick={() => router.refresh()}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  );
}

