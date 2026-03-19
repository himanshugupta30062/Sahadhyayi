import React, { Suspense, useEffect, useState } from "react";

interface DeferredSectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeightClassName?: string;
  rootMargin?: string;
  idle?: boolean;
}

const hasWindow = typeof window !== "undefined";

const DeferredSection = ({
  children,
  fallback = null,
  minHeightClassName = "min-h-[120px]",
  rootMargin = "240px",
  idle = false,
}: DeferredSectionProps) => {
  const [shouldRender, setShouldRender] = useState(!hasWindow);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasWindow || shouldRender) return;

    if (idle) {
      const idleCallback = window.requestIdleCallback?.(() => setShouldRender(true), { timeout: 2000 });
      const timeoutId = window.setTimeout(() => setShouldRender(true), 2500);

      return () => {
        if (idleCallback) {
          window.cancelIdleCallback?.(idleCallback);
        }
        window.clearTimeout(timeoutId);
      };
    }

    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [container, idle, rootMargin, shouldRender]);

  return (
    <div ref={setContainer} className={!shouldRender ? minHeightClassName : undefined}>
      {shouldRender ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
};

export default DeferredSection;
