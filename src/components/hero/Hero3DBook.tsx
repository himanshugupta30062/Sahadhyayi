import React, { useState } from "react";

interface Hero3DBookProps {
  className?: string;
}

export const Hero3DBook: React.FC<Hero3DBookProps> = ({ className = "" }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative w-full max-w-[520px] sm:max-w-[560px] lg:max-w-[600px] xl:max-w-[640px] flex items-center justify-center select-none ${className}`}
      aria-label="Sahadhyayi 3D Open Book Illustration"
    >
      {/* ── Atmospheric Warm Reading Lamp Glow (matching visual reference) ── */}
      <div
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(213,177,109,0.28)_0%,rgba(213,177,109,0.08)_45%,transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      {/* ── Warm Golden Core Radiance ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-32 sm:h-44 rounded-full bg-[radial-gradient(ellipse,rgba(213,177,109,0.35)_0%,rgba(213,177,109,0.1)_50%,transparent_75%)] blur-xl"
        aria-hidden="true"
      />

      {/* ── Grounding Desk & Leather Volumes Shadow ── */}
      <div
        className="pointer-events-none absolute -bottom-3 sm:-bottom-5 left-1/2 -translate-x-1/2 w-[85%] h-8 sm:h-12 rounded-full bg-[radial-gradient(ellipse,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_50%,transparent_75%)] blur-md"
        aria-hidden="true"
      />

      {/* ── 3D Open Book Visual ── */}
      {!imageError ? (
        <picture className="relative z-10 block w-full transform-gpu transition-transform duration-500 hover:scale-[1.015]">
          <source srcSet="/assets/hero-3d-book.webp" type="image/webp" />
          <img
            src="/assets/hero-3d-book.png"
            alt="Realistic 3D open book with warm ivory pages and dark green leather hardcover"
            width={1024}
            height={686}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-auto object-contain drop-shadow-[0_22px_35px_rgba(0,0,0,0.7)] drop-shadow-[0_0_25px_rgba(213,177,109,0.18)]"
          />
        </picture>
      ) : (
        /* ── High-Quality Vector SVG Fallback (Dark-Green, Warm-Ivory, Subtle-Gold) ── */
        <svg
          viewBox="0 0 600 400"
          className="relative z-10 w-full h-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="svgCover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14261C" />
              <stop offset="50%" stopColor="#1D3929" />
              <stop offset="100%" stopColor="#0F1B14" />
            </linearGradient>
            <linearGradient id="svgGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D794" />
              <stop offset="50%" stopColor="#D5B16D" />
              <stop offset="100%" stopColor="#8C6D32" />
            </linearGradient>
            <linearGradient id="svgPageL" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E5DCBF" />
              <stop offset="60%" stopColor="#FAF6EB" />
              <stop offset="100%" stopColor="#F3EBD4" />
            </linearGradient>
            <linearGradient id="svgPageR" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F3EBD4" />
              <stop offset="40%" stopColor="#FAF6EB" />
              <stop offset="100%" stopColor="#E5DCBF" />
            </linearGradient>
            <radialGradient id="svgGlow" cx="50%" cy="65%" r="45%">
              <stop offset="0%" stopColor="#F5D794" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#D5B16D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D5B16D" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Hardcover base */}
          <path
            d="M 60 290 Q 300 325 300 315 Q 300 325 540 290 L 535 320 Q 300 355 300 345 Q 300 355 65 320 Z"
            fill="url(#svgCover)"
            stroke="url(#svgGold)"
            strokeWidth="2"
          />

          {/* Fanned page stack edges */}
          <path
            d="M 75 285 Q 300 312 300 305 Q 300 312 525 285 L 528 290 Q 300 318 300 312 Q 300 318 72 290 Z"
            fill="#D9CFB2"
            opacity="0.8"
          />

          {/* Left arched page spread */}
          <path
            d="M 300 305 C 230 302 120 280 80 270 C 130 190 220 140 300 130 Z"
            fill="url(#svgPageL)"
            stroke="#C9BEA2"
            strokeWidth="1"
          />
          <path
            d="M 300 305 C 235 295 140 260 100 245 C 150 170 230 125 300 115 Z"
            fill="url(#svgPageL)"
            opacity="0.95"
          />

          {/* Right arched page spread */}
          <path
            d="M 300 305 C 370 302 480 280 520 270 C 470 190 380 140 300 130 Z"
            fill="url(#svgPageR)"
            stroke="#C9BEA2"
            strokeWidth="1"
          />
          <path
            d="M 300 305 C 365 295 460 260 500 245 C 450 170 370 125 300 115 Z"
            fill="url(#svgPageR)"
            opacity="0.95"
          />

          {/* Delicate individual leaf lines */}
          <path
            d="M 300 115 C 240 130 180 175 145 235"
            stroke="#BAAF91"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M 300 115 C 360 130 420 175 455 235"
            stroke="#BAAF91"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />

          {/* Center spine golden glow beam */}
          <ellipse cx="300" cy="220" rx="35" ry="110" fill="url(#svgGlow)" />
        </svg>
      )}
    </div>
  );
};

export default Hero3DBook;

