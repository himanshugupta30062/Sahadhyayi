
import React from 'react';

const COLOR_PALETTES = [
  { from: '#1a1a2e', to: '#16213e', accent: '#e94560' },
  { from: '#0f3460', to: '#533483', accent: '#e94560' },
  { from: '#2c3e50', to: '#3498db', accent: '#ecf0f1' },
  { from: '#1b4332', to: '#2d6a4f', accent: '#d8f3dc' },
  { from: '#7f5539', to: '#9c6644', accent: '#ede0d4' },
  { from: '#3c1642', to: '#086375', accent: '#1dd3b0' },
  { from: '#590d22', to: '#800f2f', accent: '#ff758f' },
  { from: '#023047', to: '#219ebc', accent: '#ffb703' },
  { from: '#3a0ca3', to: '#4361ee', accent: '#f72585' },
  { from: '#264653', to: '#2a9d8f', accent: '#e9c46a' },
  { from: '#6b2737', to: '#c97064', accent: '#f5e6cc' },
  { from: '#1b263b', to: '#415a77', accent: '#e0e1dd' },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

interface GeneratedBookCoverProps {
  title: string;
  author?: string | null;
  genre?: string | null;
  className?: string;
}

const GeneratedBookCover: React.FC<GeneratedBookCoverProps> = ({ title, author, genre, className = '' }) => {
  const hash = hashString(title);
  const palette = COLOR_PALETTES[hash % COLOR_PALETTES.length];
  const patternOffset = hash % 40 + 10;
  const patternAngle = (hash % 6) * 30;

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(${patternAngle + 135}deg, ${palette.from}, ${palette.to})`,
      }}
    >
      {/* Decorative lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(${patternAngle}deg, transparent, transparent ${patternOffset}px, ${palette.accent} ${patternOffset}px, ${palette.accent} ${patternOffset + 1}px)`,
        }}
      />

      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-6 text-center gap-2">
        {genre && (
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm mb-1"
            style={{ backgroundColor: palette.accent + '33', color: palette.accent }}
          >
            {genre}
          </span>
        )}

        <h3
          className="font-bold leading-tight text-white"
          style={{
            fontSize: title.length > 40 ? '0.8rem' : title.length > 25 ? '0.95rem' : '1.1rem',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            maxWidth: '90%',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h3>

        {author && (
          <p
            className="text-[10px] font-medium tracking-wide mt-auto opacity-80"
            style={{ color: palette.accent }}
          >
            {author}
          </p>
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Corner decoration */}
      <div
        className="absolute bottom-3 right-3 w-6 h-6 rounded-full opacity-20"
        style={{ backgroundColor: palette.accent }}
      />
    </div>
  );
};

export default GeneratedBookCover;
