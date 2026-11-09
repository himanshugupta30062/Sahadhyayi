// HeroAtomicRings.tsx — eight animated rings for the Sahadhyayi reading ecosystem.
// Each orbit contains individually discoverable and navigable product features.

import React, { useContext, useEffect, useId, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookExpertContext } from "@/contexts/book-expert.utils";

const toRadTop = (deg: number) => (deg - 90) * (Math.PI / 180);
const norm = (angle: number) => ((angle % 360) + 360) % 360;
const pos = (radius: number, deg: number) => ({
  x: radius * Math.cos(toRadTop(deg)),
  y: radius * Math.sin(toRadTop(deg)),
});

function arcPath(radius: number, startDeg: number, endDeg: number) {
  const a0 = toRadTop(startDeg);
  const a1 = toRadTop(endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const x0 = radius * Math.cos(a0);
  const y0 = radius * Math.sin(a0);
  const x1 = radius * Math.cos(a1);
  const y1 = radius * Math.sin(a1);
  return "M " + x0 + " " + y0 + " A " + radius + " " + radius + " 0 " + largeArc + " 1 " + x1 + " " + y1;
}

type OrbitIcon = "book" | "journal" | "map" | "people" | "discussion" | "story" | "quill" | "activity" | "ai";

interface OrbitFeature {
  id: string;
  label: string;
  href?: string;
  action?: "open-book-expert";
  angleOffset?: number;
}

interface OrbitBand {
  id: string;
  title: string;
  radius: number;
  color: string;
  gradientColors: [string, string, string, string];
  icon: OrbitIcon;
  start: number;
  duration: number;
  direction: 1 | -1;
  features: OrbitFeature[];
}

// These eight rings mirror the eight destinations in the homepage journey.
// Feature links are taken from the current public navigation and journey menus.
const ORBIT_BANDS: OrbitBand[] = [
  {
    id: "library-discovery",
    title: "Library & Discovery",
    radius: 145,
    color: "#1C442D",
    gradientColors: ["#A7F3D0", "#4ADE80", "#1C7C45", "#14532D"],
    icon: "book",
    start: 223.01,
    duration: 68,
    direction: 1,
    features: [
      { id: "digital-library", label: "Digital Library", href: "/library" },
      { id: "discover-books", label: "Discover Books", href: "/discovery" },
      { id: "research-papers", label: "Research Papers", href: "/research-papers" },
      { id: "book-archive", label: "Book Archive", href: "/book-library" },
      { id: "publish-book", label: "Publish Book", href: "/publish" },
      { id: "my-publications", label: "My Publications", href: "/my-publications" },
    ],
  },
  {
    id: "reading-life",
    title: "Personal Reading",
    radius: 201,
    color: "#39734A",
    gradientColors: ["#BBF7D0", "#86EFAC", "#3D9B59", "#166534"],
    icon: "journal",
    start: 31.62,
    duration: 64,
    direction: -1,
    features: [
      { id: "my-bookshelf", label: "My Bookshelf", href: "/bookshelf" },
      { id: "reading-dashboard", label: "Reading Dashboard", href: "/dashboard" },
      { id: "reading-journal", label: "Reading Journal", href: "/journal" },
      { id: "quotes-highlights", label: "Quotes & Highlights", href: "/quotes" },
    ],
  },
  {
    id: "reader-village",
    title: "Reader Discovery",
    radius: 257,
    color: "#98701F",
    gradientColors: ["#FDE68A", "#FBBF24", "#B7791F", "#854D0E"],
    icon: "map",
    start: 350.43,
    duration: 60,
    direction: 1,
    features: [
      { id: "friends-feed", label: "Friends Feed", href: "/social" },
      { id: "discover-friends", label: "Discover Friends", href: "/social?tab=friends" },
      { id: "readers-map", label: "Readers Map", href: "/map" },
      { id: "readers-around-book", label: "Readers Around a Book", href: "/reader-map" },
    ],
  },
  {
    id: "reading-together",
    title: "Read Together",
    radius: 313,
    color: "#326A9A",
    gradientColors: ["#BFDBFE", "#60A5FA", "#2563EB", "#1E3A8A"],
    icon: "discussion",
    start: 131.15,
    duration: 56,
    direction: -1,
    features: [
      { id: "reading-groups", label: "Reading Groups", href: "/groups" },
      { id: "reading-rooms", label: "Reading Rooms", href: "/social?tab=rooms" },
      { id: "book-discussions", label: "Book Discussions", href: "/social?tab=threads" },
      { id: "book-reviews", label: "Book Reviews", href: "/social?tab=reviews" },
      { id: "shared-marginalia", label: "Shared Marginalia", href: "/social?tab=margins" },
      { id: "reading-dna", label: "Reading DNA", href: "/social?tab=dna" },
    ],
  },
  {
    id: "stories-writing",
    title: "Stories & Writing",
    radius: 369,
    color: "#80539A",
    gradientColors: ["#E9D5FF", "#C084FC", "#9333EA", "#581C87"],
    icon: "story",
    start: 222.72,
    duration: 52,
    direction: 1,
    features: [
      { id: "short-stories", label: "Stories & Serials", href: "/stories" },
      { id: "community-stories", label: "Community Stories", href: "/community-stories" },
      { id: "life-stories", label: "Life Stories", href: "/life-stories" },
      { id: "articles", label: "Articles", href: "/articles" },
      { id: "blogs", label: "Blogs", href: "/blog" },
      { id: "my-articles", label: "My Articles", href: "/articles/my" },
      { id: "write-article", label: "Write Article", href: "/articles/write" },
    ],
  },
  {
    id: "authors-voices",
    title: "Authors & Voices",
    radius: 425,
    color: "#A25232",
    gradientColors: ["#FED7AA", "#FB923C", "#C15A32", "#7C2D12"],
    icon: "quill",
    start: 220.36,
    duration: 48,
    direction: -1,
    features: [
      { id: "authors", label: "Authors", href: "/authors" },
      { id: "author-connect", label: "Author Connect", href: "/author-connect" },
      { id: "reviewers-critics", label: "Reviewers & Critics", href: "/reviewers-critics" },
      { id: "scientists", label: "Scientists", href: "/scientists" },
      { id: "social-activists", label: "Social Activists", href: "/social-activists" },
      { id: "freedom-fighters", label: "Freedom Fighters", href: "/freedom-fighters" },
      { id: "publishers", label: "Publishers", href: "/publishers" },
    ],
  },
  {
    id: "events-activity",
    title: "Events & Activity",
    radius: 481,
    color: "#B36B1F",
    gradientColors: ["#FDE68A", "#F59E0B", "#D97706", "#92400E"],
    icon: "activity",
    start: 155.76,
    duration: 44,
    direction: 1,
    features: [
      { id: "events-festivals", label: "Events & Festivals", href: "/events", angleOffset: 12 },
      { id: "newsroom", label: "Newsroom", href: "/news" },
      { id: "activity-hub", label: "Activity Hub", href: "/activity" },
      { id: "reading-challenges", label: "Reading Challenges", href: "/activity?tab=challenges" },
      { id: "literary-games", label: "Literary Games", href: "/games" },
      { id: "reader-meetups", label: "Reader Meetups", href: "/activity?tab=meetups" },
    ],
  },
  {
    id: "ai-knowledge",
    title: "AI Knowledge Station",
    radius: 537,
    color: "#277B91",
    gradientColors: ["#A5F3FC", "#22D3EE", "#0891B2", "#164E63"],
    icon: "ai",
    start: 193.47,
    duration: 40,
    direction: -1,
    features: [
      { id: "book-expert-ai", label: "Book Expert AI", action: "open-book-expert" },
    ],
  },
];

const FEATURE_COUNT = ORBIT_BANDS.reduce((count, band) => count + band.features.length, 0);

interface HeroAtomicRingsProps {
  size?: number | string;
  className?: string;
  children?: ReactNode;
}

export default function HeroAtomicRings({ size = 760, className = "", children }: HeroAtomicRingsProps) {
  const navigate = useNavigate();
  const bookExpert = useContext(BookExpertContext);
  const generatedId = useId().replace(/:/g, "");
  const gradientId = (bandId: string) => "hero-orbit-" + bandId + "-" + generatedId;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  const featureRefs = useRef<(SVGGElement | null)[][]>([]);
  const featureLabelRefs = useRef<(SVGGElement | null)[][]>([]);
  const ringAngles = useRef(ORBIT_BANDS.map(() => 0));
  const pausedForKeyboard = useRef(false);

  const openFeature = (feature: OrbitFeature) => {
    if (feature.action === "open-book-expert") {
      if (bookExpert && !bookExpert.isOpen) bookExpert.toggleChat();
      return;
    }
    if (feature.href) navigate(feature.href);
  };

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;
    let raf: number | null = null;
    let isInViewport = true;
    let lastFrameTime = performance.now();

    const renderScene = () => {
      ORBIT_BANDS.forEach((band, bandIndex) => {
        ringRefs.current[bandIndex]?.setAttribute(
          "transform",
          "rotate(" + (ringAngles.current[bandIndex] || 0) + " 0 0)",
        );

        band.features.forEach((feature, featureIndex) => {
          // Feature markers stay in stable positions so every destination remains
          // readable. The coloured arc rotates underneath them to preserve motion.
          const baseAngle = band.start + (360 / band.features.length) * featureIndex + (feature.angleOffset || 0);
          const angle = norm(baseAngle);
          const point = pos(band.radius, angle);
          const node = featureRefs.current[bandIndex]?.[featureIndex];
          node?.setAttribute("transform", "translate(" + point.x + ", " + point.y + ")");

          // Place a horizontal label just beyond the orbit path, away from its node.
          const labelOffset = pos(24, angle);
          const label = featureLabelRefs.current[bandIndex]?.[featureIndex];
          label?.setAttribute(
            "transform",
            "translate(" + labelOffset.x + ", " + labelOffset.y + ")",
          );
        });
      });
    };

    const tick = (now: number) => {
      const elapsed = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      if (!pausedForKeyboard.current && !document.hidden && !prefersReducedMotion) {
        ringAngles.current = ringAngles.current.map((angle, index) =>
          norm(angle + (360 / ORBIT_BANDS[index].duration) * ORBIT_BANDS[index].direction * elapsed),
        );
      }

      renderScene();
      if (!prefersReducedMotion && !document.hidden) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    const stopAnimation = () => {
      if (raf !== null) {
        window.cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const startAnimation = () => {
      if (prefersReducedMotion || document.hidden || !isInViewport || raf !== null) return;
      lastFrameTime = performance.now();
      raf = window.requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };
    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      if (prefersReducedMotion) {
        stopAnimation();
        renderScene();
      } else {
        startAnimation();
      }
    };

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          isInViewport = entry.isIntersecting;
          if (isInViewport) startAnimation();
          else stopAnimation();
        }, { rootMargin: "120px" })
      : null;
    if (containerRef.current) observer?.observe(containerRef.current);

    renderScene();
    startAnimation();
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionPreferenceChange);
    } else {
      motionQuery.addListener(onMotionPreferenceChange);
    }

    return () => {
      stopAnimation();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", onMotionPreferenceChange);
      } else {
        motionQuery.removeListener(onMotionPreferenceChange);
      }
    };
  }, []);

  const handleFeatureKeyDown = (event: ReactKeyboardEvent<SVGGElement>, feature: OrbitFeature) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFeature(feature);
    }
  };

  const setKeyboardPause = (paused: boolean) => {
    pausedForKeyboard.current = paused;
  };

  const renderOrbitIcon = (icon: OrbitIcon) => {
    switch (icon) {
      case "book":
        return (
          <path d="M -6 -3.5 C -3 -4.5 -1 -4.5 0 -2.5 C 1 -4.5 3 -4.5 6 -3.5 L 6 3.5 C 3 2.5 1 2.5 0 4.5 C -1 2.5 -3 2.5 -6 3.5 Z M 0 -2.5 L 0 4.5" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        );
      case "journal":
        return (
          <>
            <path d="M -4.5 -6 H 3 L 5.5 -3.5 V 6 H -4.5 Z M 3 -6 V -3.5 H 5.5" fill="none" stroke="#ffffff" strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M -2 0 H 2.8 M -2 3 H 2.8" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          </>
        );
      case "map":
        return (
          <>
            <path d="M 0 7 C -1.5 4 -6 -0.5 -6 -4 A 6 6 0 1 1 6 -4 C 6 -0.5 1.5 4 0 7 Z" fill="none" stroke="#ffffff" strokeWidth="1.3" />
            <circle cx="0" cy="-4" r="2" fill="#ffffff" />
          </>
        );
      case "people":
        return (
          <>
            <circle cx="-2.5" cy="-2.5" r="2.2" fill="#ffffff" />
            <path d="M -6 4 C -6 1.5 -3.8 0.8 -2.5 0.8 C -1 0.8 1 1.5 1 4" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="3" cy="-1.5" r="1.8" fill="#ffffff" />
            <path d="M 2 2 C 3.5 1.7 5.8 2.3 5.8 4" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          </>
        );
      case "discussion":
        return (
          <>
            <path d="M -6 -4.5 H 4.5 V 2 H -1.5 L -5 5 V 2 H -6 Z" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 0 -1 H 6 V 4 H 3 L 1 6" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinejoin="round" />
          </>
        );
      case "story":
        return (
          <path d="M 4.5 -6 C 5 0 -0.5 4.5 -5 6 C -4 1 -1 -4.5 4.5 -6 Z M -5 6 L 2 -2 M -1 2 L 2.5 2.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        );
      case "quill":
        return (
          <path d="M 4.5 -6 C 5 0 -0.5 4.5 -5 6 C -4 1 -1 -4.5 4.5 -6 Z M -5 6 L 2 -2 M -1 2 L 2.5 2.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        );
      case "activity":
        return (
          <>
            <path d="M 0 -7 L 1.8 -1.8 L 7 0 L 1.8 1.8 L 0 7 L -1.8 1.8 L -7 0 L -1.8 -1.8 Z" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
          </>
        );
      case "ai":
        return (
          <>
            <path d="M 0 -7 L 1.8 -1.8 L 7 0 L 1.8 1.8 L 0 7 L -1.8 1.8 L -7 0 L -1.8 -1.8 Z" fill="none" stroke="#ffffff" strokeWidth="1.15" strokeLinejoin="round" />
            <path d="M -7 -6 V -3 M -8.5 -4.5 H -5.5 M 7 5 V 8 M 5.5 6.5 H 8.5" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <div className={"relative flex w-full flex-col items-center " + className}>
      <div
        ref={containerRef}
        className="relative flex aspect-square w-full items-center justify-center"
        style={
          typeof size === "number"
            ? { width: size, height: size }
            : typeof size === "string" && size !== "100%"
            ? { width: size, height: size }
            : { width: "100%" }
        }
      >
      <svg
        className="block h-full w-full max-h-full max-w-full overflow-visible"
        viewBox="-660 -660 1320 1320"
        role="group"
        aria-label={"Explore " + FEATURE_COUNT + " Sahadhyayi features across eight animated rings"}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <style>{`
            .hero-orbit-node:focus-visible .hero-orbit-focus-ring { opacity: 1; }
            .hero-orbit-node:focus-visible .hero-orbit-label rect { stroke-width: 3; }
            .dark .hero-orbit-label rect { fill: #111614; }
            .dark .hero-orbit-label text { fill: #F3F0E7; }
            @media (max-width: 1023px) {
              .hero-orbit-node { display: none; }
            }
          `}</style>
          {ORBIT_BANDS.map((band) => (
            <linearGradient
              key={band.id}
              id={gradientId(band.id)}
              gradientUnits="userSpaceOnUse"
              x1={-band.radius}
              y1={-band.radius}
              x2={band.radius}
              y2={band.radius}
            >
              {band.gradientColors.map((color, index) => (
                <stop key={color} offset={((index / (band.gradientColors.length - 1)) * 100) + "%"} stopColor={color} />
              ))}
            </linearGradient>
          ))}
        </defs>

        {ORBIT_BANDS.map((band, bandIndex) => (
          <g key={band.id}>
            <circle
              r={band.radius}
              cx={0}
              cy={0}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.10"
              strokeWidth="2"
              strokeDasharray="2 9"
            />
            <g ref={(element) => { ringRefs.current[bandIndex] = element; }}>
              <path
                d={arcPath(band.radius, band.start, band.start + 248)}
                fill="none"
                stroke={"url(#" + gradientId(band.id) + ")"}
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          </g>
        ))}

        {ORBIT_BANDS.map((band, bandIndex) =>
          band.features.map((feature, featureIndex) => {
            const labelWidth = Math.min(190, Math.max(90, feature.label.length * 8.1 + 20));
            const isAction = feature.action === "open-book-expert";
            return (
              <g
                key={feature.id}
                ref={(element) => {
                  if (!featureRefs.current[bandIndex]) featureRefs.current[bandIndex] = [];
                  featureRefs.current[bandIndex][featureIndex] = element;
                }}
                role={isAction ? "button" : "link"}
                tabIndex={0}
                aria-label={isAction ? "Open Book Expert AI" : "Explore " + feature.label}
                data-feature-id={feature.id}
                onClick={() => openFeature(feature)}
                onKeyDown={(event) => handleFeatureKeyDown(event, feature)}
                onFocus={() => setKeyboardPause(true)}
                onBlur={() => setKeyboardPause(false)}
                className="hero-orbit-node pointer-events-auto cursor-pointer outline-none"
              >
                <title>{isAction ? "Open Book Expert AI" : "Explore " + feature.label}</title>
                <circle
                  className="hero-orbit-focus-ring"
                  r="16"
                  fill="none"
                  stroke={band.color}
                  strokeWidth="2.5"
                  opacity="0"
                />
                <circle r="11" fill={band.color} stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" />
                {renderOrbitIcon(band.icon)}
                <g
                  ref={(element) => {
                    if (!featureLabelRefs.current[bandIndex]) featureLabelRefs.current[bandIndex] = [];
                    featureLabelRefs.current[bandIndex][featureIndex] = element;
                  }}
                  className="hero-orbit-label"
                >
                  <rect
                    x={-labelWidth / 2}
                    y="-10"
                    width={labelWidth}
                    height="20"
                    rx="13"
                    fill="#FAFAF8"
                    fillOpacity="0.98"
                    stroke={band.color}
                    strokeOpacity="0.9"
                    strokeWidth="1.35"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    letterSpacing="0.05"
                    fill="#1C201D"
                  >
                    {feature.label}
                  </text>
                </g>
              </g>
            );
          }),
        )}
      </svg>

      {children && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto flex w-full max-w-[92%] items-center justify-center sm:max-w-[88%]">
            {children}
          </div>
        </div>
      )}
      </div>

      {/* The radial labels become a clear, thumb-friendly feature directory on tablets and phones. */}
      <nav
        aria-label="Explore Sahadhyayi features"
        className="mt-3 grid w-full max-w-4xl grid-cols-1 gap-2 px-1 pb-2 lg:hidden sm:grid-cols-2"
      >
        <p className="col-span-full mb-1 text-center text-xs font-medium tracking-wide text-[#636B65] dark:text-[#A5ADA6]">
          Explore every part of Sahadhyayi
        </p>
        {ORBIT_BANDS.map((band) => (
          <details
            key={band.id}
            className="group overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white/85 shadow-sm transition-colors open:border-[#CDBB99] dark:border-[#29332D] dark:bg-[#111614]/90 dark:open:border-[#6B5A37]"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3 py-3 outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8F681C] dark:focus-visible:ring-[#D5B16D] [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full ring-4 ring-black/5 dark:ring-white/10" style={{ backgroundColor: band.color }} />
              <span className="min-w-0 flex-1 text-left text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">{band.title}</span>
              <span className="text-[11px] font-medium text-[#636B65] dark:text-[#A5ADA6]">{band.features.length} {band.features.length === 1 ? "feature" : "features"}</span>
              <span aria-hidden="true" className="ml-1 text-lg leading-none text-[#8F681C] transition-transform group-open:rotate-45 dark:text-[#D5B16D]">+</span>
            </summary>
            <div className="grid grid-cols-1 gap-1 border-t border-[#E8E2D9] p-2 dark:border-[#29332D] sm:grid-cols-2">
              {band.features.map((feature) =>
                feature.action === "open-book-expert" ? (
                  <button key={feature.id} type="button" aria-label="Open Book Expert AI" onClick={() => openFeature(feature)} className="flex min-h-10 items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[#1C442D] transition-colors hover:bg-[#F2F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:text-[#D5B16D] dark:hover:bg-[#1B241E]">
                    {feature.label}
                  </button>
                ) : (
                  <Link key={feature.id} to={feature.href || "/"} className="flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium text-[#1C201D] transition-colors hover:bg-[#F2F5EF] hover:text-[#1C442D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F681C] dark:text-[#F3F0E7] dark:hover:bg-[#1B241E] dark:hover:text-[#D5B16D]">
                    {feature.label}
                  </Link>
                ),
              )}
            </div>
          </details>
        ))}
      </nav>
    </div>
  );
}
