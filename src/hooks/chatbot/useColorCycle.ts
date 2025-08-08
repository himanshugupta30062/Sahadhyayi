import { useEffect, useState } from 'react';

export function useColorCycle(classes: string[], intervalMs = 10000) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % classes.length), intervalMs);
    return () => clearInterval(id);
  }, [classes, intervalMs]);
  return classes[idx] || '';
}
