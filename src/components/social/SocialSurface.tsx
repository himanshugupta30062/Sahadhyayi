import type { ReactNode } from "react";

type SocialSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function SocialSurface({
  children,
  className = "",
}: SocialSurfaceProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-[#E8E2D9] dark:border-[#29332D]",
        "bg-white dark:bg-[#111614] text-[#1C201D] dark:text-[#F3F0E7]",
        "shadow-[0_2px_12px_rgba(28,32,29,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.18)]",
        "transition-colors duration-200",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
