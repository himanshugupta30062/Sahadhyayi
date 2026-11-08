import React from 'react';

interface StudentCyclistProps {
  className?: string;
  isPedaling?: boolean;
  facing?: 'right' | 'left';
  tiltAngle?: number; // In degrees, for banking into curves
  accentColor?: string;
  size?: number; // width in pixels (height auto scales)
}

export const StudentCyclist: React.FC<StudentCyclistProps> = ({
  className = '',
  isPedaling = true,
  facing = 'right',
  tiltAngle = 0,
  accentColor = '#1C442D',
  size = 140,
}) => {
  const isFlipped = facing === 'left';

  return (
    <div
      className={`relative inline-block select-none pointer-events-none transition-transform duration-300 ease-out ${className}`}
      style={{
        width: `${size}px`,
        height: `${(size * 105) / 140}px`,
        transform: `rotate(${tiltAngle}deg) ${isFlipped ? 'scaleX(-1)' : ''}`,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-md"
      >
        <defs>
          {/* Headlamp beam gradient */}
          <linearGradient id="lampGlow" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#FACC15" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
          </linearGradient>

          {/* Cyclist frame bob animation */}
          <style>
            {`
              @keyframes cyclistBob {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-2px); }
              }
              @keyframes wheelSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pedalSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes bookmarkFlutter {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(12deg); }
              }
              .cyclist-bob {
                animation: cyclistBob 0.6s ease-in-out infinite;
              }
              .wheel-spin {
                transform-origin: center;
                animation: wheelSpin 0.8s linear infinite;
              }
              .pedal-spin {
                transform-origin: 72px 90px;
                animation: pedalSpin 0.8s linear infinite;
              }
              .bookmark-flutter {
                transform-origin: top left;
                animation: bookmarkFlutter 0.5s ease-in-out infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .cyclist-bob, .wheel-spin, .pedal-spin, .bookmark-flutter {
                  animation: none !important;
                }
              }
            `}
          </style>
        </defs>

        {/* Headlamp forward light cone */}
        <polygon
          points="130,73 175,56 175,90"
          fill="url(#lampGlow)"
          className="opacity-70"
        />

        {/* --- SHADOW UNDER TIRES --- */}
        <ellipse cx="40" cy="112" rx="22" ry="4" fill="#000000" fillOpacity="0.2" />
        <ellipse cx="118" cy="112" rx="22" ry="4" fill="#000000" fillOpacity="0.2" />

        {/* --- REAR WHEEL (Center at 40, 92, radius 20) --- */}
        <g transform="translate(40, 92)">
          {/* Outer Tire */}
          <circle r="20" stroke="#262626" strokeWidth="4" fill="none" />
          {/* Inner Rim */}
          <circle r="18" stroke="#D4D4D8" strokeWidth="1.5" fill="none" />
          {/* Spokes (Rotating) */}
          <g className={isPedaling ? 'wheel-spin' : ''}>
            <line x1="-18" y1="0" x2="18" y2="0" stroke="#A1A1AA" strokeWidth="1" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#A1A1AA" strokeWidth="1" />
            <line x1="-13" y1="-13" x2="13" y2="13" stroke="#A1A1AA" strokeWidth="1" />
            <line x1="-13" y1="13" x2="13" y2="-13" stroke="#A1A1AA" strokeWidth="1" />
          </g>
          {/* Wheel Hub */}
          <circle r="3.5" fill="#52525B" />
          <circle r="1.5" fill="#F4F4F5" />
        </g>

        {/* --- FRONT WHEEL (Center at 118, 92, radius 20) --- */}
        <g transform="translate(118, 92)">
          {/* Outer Tire */}
          <circle r="20" stroke="#262626" strokeWidth="4" fill="none" />
          {/* Inner Rim */}
          <circle r="18" stroke="#D4D4D8" strokeWidth="1.5" fill="none" />
          {/* Spokes (Rotating) */}
          <g className={isPedaling ? 'wheel-spin' : ''}>
            <line x1="-18" y1="0" x2="18" y2="0" stroke="#A1A1AA" strokeWidth="1" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#A1A1AA" strokeWidth="1" />
            <line x1="-13" y1="-13" x2="13" y2="13" stroke="#A1A1AA" strokeWidth="1" />
            <line x1="-13" y1="13" x2="13" y2="-13" stroke="#A1A1AA" strokeWidth="1" />
          </g>
          {/* Wheel Hub */}
          <circle r="3.5" fill="#52525B" />
          <circle r="1.5" fill="#F4F4F5" />
        </g>

        {/* --- BICYCLE FRAME & RIGID PARTS --- */}
        {/* Chainstay: Rear hub (40, 92) to Bottom Bracket (74, 92) */}
        <line x1="40" y1="92" x2="74" y2="92" stroke="#52525B" strokeWidth="3" strokeLinecap="round" />
        {/* Seatstay: Rear hub (40, 92) to Seat Cluster (62, 64) */}
        <line x1="40" y1="92" x2="62" y2="64" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        {/* Seat Tube: Seat Cluster (62, 64) to Bottom Bracket (74, 92) */}
        <line x1="62" y1="64" x2="74" y2="92" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        {/* Down Tube: Head Tube (104, 62) to Bottom Bracket (74, 92) */}
        <line x1="104" y1="62" x2="74" y2="92" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
        {/* Top Tube: Seat Cluster (62, 64) to Head Tube (104, 62) */}
        <line x1="62" y1="64" x2="104" y2="62" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        {/* Front Fork: Head Tube (104, 62) down to Front Hub (118, 92) */}
        <line x1="104" y1="62" x2="118" y2="92" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />

        {/* Handlebar Stem & Handlebars */}
        <path d="M104,62 L107,52 L116,51 L118,55" stroke="#71717A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        {/* Front Headlamp */}
        <rect x="116" y="52" width="7" height="6" rx="1.5" fill="#3F3F46" />
        <circle cx="123" cy="55" r="2.2" fill="#FEF08A" />

        {/* Saddle / Seat */}
        <path d="M54,61 C57,60 69,60 71,62 C71,64 66,65 58,64 Z" fill="#1C1917" />
        <line x1="62" y1="64" x2="62" y2="60" stroke="#71717A" strokeWidth="2.5" />

        {/* Chain and Chainring */}
        <circle cx="74" cy="92" r="7" stroke="#71717A" strokeWidth="1.8" fill="#E4E4E7" />

        {/* --- STUDENT CYCLIST BODY (WITH BOBBING) --- */}
        <g className={isPedaling ? 'cyclist-bob' : ''}>
          {/* Backpack (Layered behind back) */}
          <g>
            <path
              d="M52,42 C49,42 46,47 46,55 C46,63 50,67 56,67 C61,67 63,63 62,55 C62,47 57,42 52,42 Z"
              fill="#D97706"
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {/* Backpack pocket */}
            <path d="M47,56 C47,60 50,63 55,63 C58,63 60,60 60,56" stroke="#92400E" strokeWidth="1.2" fill="none" />
            {/* Book peeking out of backpack */}
            <rect x="50" y="37" width="10" height="8" rx="1" fill="#38BDF8" transform="rotate(-15 50 37)" />
            <rect x="51" y="39" width="8" height="6" rx="0.5" fill="#F8FAFC" transform="rotate(-15 51 39)" />
            {/* Fluttering Red Ribbon Bookmark */}
            <path
              d="M58,35 C60,33 63,33 65,31 C63,34 65,37 63,39 Z"
              fill="#EF4444"
              className="bookmark-flutter"
            />
            {/* Shoulder straps */}
            <path d="M58,45 C64,48 68,54 68,62" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>

          {/* Student Torso / Jacket */}
          {/* Leaning forward in active, joyful riding posture */}
          <path
            d="M62,60 C60,54 62,44 71,40 C78,38 84,43 85,49 C85,55 79,62 70,64 Z"
            fill="#0284C7"
            stroke="#0369A1"
            strokeWidth="1.2"
          />
          {/* Jacket collar & details */}
          <path d="M78,39 L75,46" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" />

          {/* Student Head & Face */}
          {/* Neck */}
          <path d="M78,39 L82,34" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
          {/* Head */}
          <circle cx="85" cy="30" r="8" fill="#FDE68A" />
          {/* Joyful expression: Eye & Smile */}
          <path d="M88,29 C89,30 90,30 91,29" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M87,33 C89,35 91,34 91,32" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="86" cy="32" r="1.5" fill="#F87171" opacity="0.6" /> {/* Rosy cheek */}

          {/* Hair & Cap */}
          {/* Student Baker-boy / Cycling cap */}
          <path
            d="M77,28 C77,22 84,20 91,22 C94,23 96,26 95,29 C92,27 86,27 79,28 Z"
            fill="#1E293B"
          />
          {/* Cap visor extending forward */}
          <path d="M93,25 C97,25 101,27 101,29 C98,30 94,29 93,28 Z" fill="#0F172A" />
          {/* Windblown curls */}
          <path d="M78,28 C76,32 77,34 78,36" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />

          {/* Cyclist Arms holding Handlebars */}
          {/* Upper arm from shoulder (80, 44) to elbow (94, 52) */}
          <path d="M80,44 L95,50 L114,52" stroke="#0284C7" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Hand on handlebar */}
          <circle cx="114" cy="52" r="2.8" fill="#FDE68A" />

          {/* Cyclist Legs & Pedals */}
          {/* Right Leg (Foreground): Thigh from hip (66, 62) to knee (80, 74) to foot on pedal */}
          <g>
            <path d="M66,62 L80,72 L76,88" stroke="#1E293B" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Sneaker/Shoe */}
            <path d="M72,88 L81,89 C83,89 84,91 82,92 L72,92 Z" fill="#DC2626" />
            <rect x="73" y="90" width="9" height="2" fill="#FFFFFF" />
          </g>

          {/* Left Leg (Background, darker tone) */}
          <g opacity="0.6">
            <path d="M66,62 L60,76 L68,84" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M65,84 L72,84 L70,87 L63,87 Z" fill="#991B1B" />
          </g>
        </g>

        {/* Pedals & Crank Mechanism */}
        <g className={isPedaling ? 'pedal-spin' : ''}>
          <line x1="74" y1="92" x2="76" y2="99" stroke="#71717A" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="72" y="99" width="8" height="3" rx="1" fill="#27272A" />
        </g>
      </svg>
    </div>
  );
};
