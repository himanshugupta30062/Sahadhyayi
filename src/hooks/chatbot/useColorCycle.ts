import { useEffect, useState } from 'react';

export function useColorCycle(colors: string[], intervalMs: number) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % colors.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [colors, intervalMs]);

  return colors[idx];
}
