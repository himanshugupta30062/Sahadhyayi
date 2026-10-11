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
        "rounded-2xl border border-[#29332D]",
        "bg-[#111614] text-[#F3F0E7]",
        "shadow-[0_12px_36px_rgba(0,0,0,0.18)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
