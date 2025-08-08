import { useEffect, useRef, useState } from 'react';

export function useVisible<T extends HTMLElement>() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: '200px'
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

