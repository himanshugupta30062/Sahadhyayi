import React, { useEffect, useState } from 'react';

interface Props {
  /** Optional: container ref to measure progress against (defaults to document) */
  targetRef?: React.RefObject<HTMLElement>;
}

const ReadingProgress: React.FC<Props> = ({ targetRef }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = targetRef?.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = -rect.top;
        const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
        setProgress(pct);
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
        setProgress(pct);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-[hsl(var(--brand-primary))] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ReadingProgress;
