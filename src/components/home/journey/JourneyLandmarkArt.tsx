import React from 'react';

interface LandmarkArtProps {
  id: string;
  className?: string;
  isCurrent?: boolean;
}

export const JourneyLandmarkArt: React.FC<LandmarkArtProps> = ({
  id,
  className = '',
  isCurrent = false,
}) => {
  const currentGlowClass = isCurrent ? 'drop-shadow-[0_8px_24px_rgba(28,68,45,0.25)] dark:drop-shadow-[0_8px_24px_rgba(213,177,109,0.3)]' : 'drop-shadow-sm';

  switch (id) {
    case 'library-city':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Distant city silhouette */}
          <path d="M10,140 L10,95 L25,95 L25,80 L35,80 L35,140" fill="#CBD5E1" opacity="0.6" />
          <path d="M205,140 L205,85 L225,85 L225,140" fill="#CBD5E1" opacity="0.6" />
          {/* Classical Library Dome */}
          <path d="M85,75 C85,45 155,45 155,75 Z" fill="#94A3B8" />
          <path d="M92,75 C92,52 148,52 148,75 Z" fill="#64748B" />
          <line x1="120" y1="42" x2="120" y2="30" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="120" cy="28" r="3" fill="#F59E0B" />
          {/* Library Pediment / Triangular Roof */}
          <polygon points="40,95 120,62 200,95" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          <polygon points="55,93 120,67 185,93" fill="#F8FAFC" />
          {/* Arch inscription */}
          <rect x="75" y="80" width="90" height="9" rx="1.5" fill="#CBD5E1" />
          <line x1="85" y1="84.5" x2="155" y2="84.5" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Classical Columns */}
          <g stroke="#94A3B8" strokeWidth="1.5" fill="#F1F5F9">
            <rect x="58" y="95" width="14" height="52" rx="1" />
            <rect x="88" y="95" width="14" height="52" rx="1" />
            <rect x="138" y="95" width="14" height="52" rx="1" />
            <rect x="168" y="95" width="14" height="52" rx="1" />
          </g>
          {/* Arched Library Portal / Doorway */}
          <path d="M107,147 L107,112 C107,103 133,103 133,112 L133,147 Z" fill="#1E293B" />
          <path d="M110,147 L110,114 C110,107 130,107 130,114 L130,147 Z" fill="#D97706" opacity="0.3" />
          {/* Stack of books on entrance steps */}
          <rect x="114" y="142" width="12" height="2.5" rx="0.5" fill="#DC2626" />
          <rect x="115" y="139" width="10" height="2.5" rx="0.5" fill="#2563EB" />
          <rect x="116" y="136" width="9" height="2.5" rx="0.5" fill="#16A34A" />
          {/* Steps */}
          <rect x="35" y="147" width="170" height="5" fill="#CBD5E1" />
          <rect x="25" y="152" width="190" height="5" fill="#94A3B8" />
          {/* Streetlamp */}
          <path d="M30,152 L30,110 L34,106 L34,115" stroke="#334155" strokeWidth="2" fill="none" />
          <circle cx="34" cy="106" r="3" fill="#FEF08A" />
        </svg>
      );

    case 'reading-valley':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Rolling grass hills */}
          <path d="M0,150 Q70,110 160,135 T240,125 L240,180 L0,180 Z" fill="#86EFAC" opacity="0.7" />
          <path d="M0,135 Q100,100 180,120 T240,140 L240,180 L0,180 Z" fill="#4ADE80" opacity="0.5" />
          <path d="M0,155 Q80,130 170,145 T240,150 L240,180 L0,180 Z" fill="#22C55E" opacity="0.4" />
          {/* Sparkling blue brook / stream */}
          <path d="M0,165 Q80,155 140,170 T240,162 L240,180 L0,180 Z" fill="#38BDF8" opacity="0.6" />
          {/* The Ancient Oak Tree Trunk */}
          <path d="M145,150 Q148,115 140,95 Q145,85 155,95 Q152,120 162,150 Z" fill="#78350F" />
          {/* Oak Canopy Layers */}
          <ellipse cx="148" cy="85" rx="38" ry="30" fill="#15803D" />
          <ellipse cx="132" cy="75" rx="26" ry="22" fill="#16A34A" />
          <ellipse cx="162" cy="72" rx="28" ry="22" fill="#22C55E" />
          <ellipse cx="146" cy="62" rx="24" ry="18" fill="#4ADE80" />
          {/* Sunbeams filtering through leaves */}
          <polygon points="135,75 110,145 130,145" fill="#FEF08A" opacity="0.25" />
          {/* Wooden Reading Bench beneath the tree */}
          <rect x="95" y="138" width="34" height="4" rx="1" fill="#92400E" />
          <rect x="95" y="142" width="34" height="2" rx="0.5" fill="#78350F" />
          <line x1="99" y1="142" x2="99" y2="152" stroke="#451A03" strokeWidth="2" />
          <line x1="125" y1="142" x2="125" y2="152" stroke="#451A03" strokeWidth="2" />
          <line x1="97" y1="130" x2="97" y2="138" stroke="#451A03" strokeWidth="2" />
          <line x1="127" y1="130" x2="127" y2="138" stroke="#451A03" strokeWidth="2" />
          <rect x="95" y="128" width="34" height="3" rx="1" fill="#92400E" />
          {/* Reader sitting peacefully on bench reading */}
          <circle cx="108" cy="122" r="4" fill="#FDE68A" />
          <path d="M106,126 L110,138 L116,138 L116,148" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Open Book in Reader's hands */}
          <path d="M112,132 L116,134 L120,132 L120,136 L116,138 L112,136 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.8" />
          {/* Wildflowers */}
          <circle cx="80" cy="155" r="2.5" fill="#F43F5E" />
          <circle cx="88" cy="158" r="2.5" fill="#F59E0B" />
          <circle cx="178" cy="152" r="2.5" fill="#A855F7" />
          <circle cx="188" cy="156" r="2.5" fill="#EC4899" />
        </svg>
      );

    case 'reader-village':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Village Cottages */}
          {/* Left Cottage */}
          <rect x="35" y="98" width="60" height="45" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
          {/* Thatched/Tile Roof */}
          <polygon points="30,98 65,68 100,98" fill="#B45309" />
          <rect x="42" y="70" width="8" height="18" fill="#78350F" /> {/* Chimney */}
          {/* Smoke puffs from chimney */}
          <circle cx="46" cy="62" r="3" fill="#E2E8F0" opacity="0.7" />
          <circle cx="49" cy="54" r="4" fill="#E2E8F0" opacity="0.5" />
          <circle cx="53" cy="45" r="5" fill="#E2E8F0" opacity="0.3" />
          {/* Cottage Door & Window with flowerbox */}
          <rect x="58" y="115" width="14" height="28" rx="1" fill="#78350F" />
          <rect x="76" y="106" width="12" height="12" fill="#93C5FD" stroke="#78350F" strokeWidth="1" />
          <rect x="75" y="118" width="14" height="3" fill="#DC2626" /> {/* Flowerbox */}

          {/* Right Cottage (partially behind) */}
          <rect x="145" y="90" width="65" height="52" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <polygon points="140,90 178,60 215,90" fill="#991B1B" />
          <rect x="160" y="105" width="16" height="16" fill="#FDE047" stroke="#78350F" strokeWidth="1" />

          {/* Center Stage: Neighborhood Book Exchange Kiosk ("Take a book, leave a book") */}
          <g transform="translate(105, 95)">
            {/* Post */}
            <rect x="14" y="28" width="6" height="26" fill="#78350F" />
            {/* Wooden Kiosk House */}
            <polygon points="5,8 17,-3 29,8" fill="#047857" stroke="#065F46" strokeWidth="1.5" />
            <rect x="7" y="8" width="20" height="22" fill="#FEF3C7" stroke="#78350F" strokeWidth="1.5" />
            {/* Glass door showing books inside */}
            <rect x="9" y="10" width="16" height="18" fill="#E0F2FE" opacity="0.8" stroke="#38BDF8" strokeWidth="0.8" />
            {/* Books inside */}
            <rect x="11" y="16" width="3" height="10" fill="#DC2626" />
            <rect x="15" y="15" width="3.5" height="11" fill="#2563EB" />
            <rect x="19.5" y="17" width="3" height="9" fill="#16A34A" />
            {/* Sign: "BOOKS" */}
            <rect x="10" y="3" width="14" height="4" rx="0.8" fill="#FFFFFF" />
            <line x1="12" y1="5" x2="22" y2="5" stroke="#047857" strokeWidth="1.5" strokeDasharray="1.5 1" />
          </g>

          {/* Cobblestone ground */}
          <ellipse cx="60" cy="155" rx="5" ry="2" fill="#CBD5E1" />
          <ellipse cx="80" cy="158" rx="6" ry="2" fill="#94A3B8" />
          <ellipse cx="130" cy="156" rx="7" ry="2.5" fill="#CBD5E1" />
          <ellipse cx="160" cy="154" rx="5" ry="2" fill="#94A3B8" />
          <ellipse cx="190" cy="157" rx="6" ry="2" fill="#CBD5E1" />
        </svg>
      );

    case 'reading-bridge':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Sparkling River */}
          <rect x="0" y="125" width="240" height="55" fill="#0284C7" opacity="0.4" />
          <path d="M10,135 Q40,130 80,136 T160,132 T240,135" stroke="#BAE6FD" strokeWidth="1.5" fill="none" />
          <path d="M0,150 Q50,146 110,152 T200,148 T240,150" stroke="#BAE6FD" strokeWidth="1.5" fill="none" />
          <path d="M20,165 Q70,160 140,166 T240,162" stroke="#E0F2FE" strokeWidth="1.5" fill="none" />
          {/* Water Lilies and paper boat */}
          <ellipse cx="45" cy="155" rx="7" ry="3" fill="#15803D" />
          <circle cx="45" cy="154" r="2" fill="#F472B6" />
          {/* Origami paper boat floating */}
          <polygon points="190,156 198,148 206,156 186,156" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.8" />

          {/* Grand Stone Arch Bridge */}
          {/* Left Arch, Middle Arch, Right Arch */}
          <path
            d="M0,110 L240,110 L240,135 L210,135 C200,115 170,115 160,135 L130,135 C120,115 90,115 80,135 L50,135 C40,115 10,115 0,135 Z"
            fill="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {/* Arch Keystone accents */}
          <polygon points="23,115 27,115 26,120 24,120" fill="#64748B" />
          <polygon points="103,115 107,115 106,120 104,120" fill="#64748B" />
          <polygon points="183,115 187,115 186,120 184,120" fill="#64748B" />

          {/* Stone Balustrade / Railings with pillars */}
          <rect x="0" y="103" width="240" height="4" fill="#94A3B8" />
          <rect x="0" y="94" width="240" height="3" fill="#64748B" />
          {/* Balusters */}
          {Array.from({ length: 15 }).map((_, i) => (
            <rect key={i} x={10 + i * 15} y="97" width="3" height="6" fill="#94A3B8" />
          ))}

          {/* Readers conversing together on the bridge */}
          {/* Reader 1 */}
          <circle cx="100" cy="85" r="3.5" fill="#FDE68A" />
          <path d="M100,89 L100,103" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
          {/* Reader 2 (facing Reader 1) */}
          <circle cx="112" cy="85" r="3.5" fill="#FDE68A" />
          <path d="M112,89 L112,103" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
          {/* Shared book held between them */}
          <path d="M104,94 L106,96 L108,94" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          {/* Speech bubble */}
          <ellipse cx="118" cy="74" rx="7" ry="5" fill="#FFFFFF" stroke="#64748B" strokeWidth="0.8" />
          <path d="M113,78 L110,81 L115,79" fill="#FFFFFF" stroke="#64748B" strokeWidth="0.8" />
          <line x1="114" y1="74" x2="122" y2="74" stroke="#047857" strokeWidth="1" strokeDasharray="1.5 1" />

          {/* Bridge Lampposts */}
          <line x1="15" y1="94" x2="15" y2="78" stroke="#334155" strokeWidth="2" />
          <circle cx="15" cy="77" r="3.5" fill="#FEF08A" />
          <line x1="225" y1="94" x2="225" y2="78" stroke="#334155" strokeWidth="2" />
          <circle cx="225" cy="77" r="3.5" fill="#FEF08A" />
        </svg>
      );

    case 'storytelling-forest':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Enchanted Birch Forest */}
          {/* Background Pines */}
          <polygon points="35,130 15,100 25,100 10,75 35,50 60,75 45,100 55,100" fill="#1E3A2F" opacity="0.6" />
          <polygon points="195,130 175,100 185,100 170,75 195,50 220,75 205,100 215,100" fill="#1E3A2F" opacity="0.6" />

          {/* Slender Birch Trunks with horizontal marks */}
          <g fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8">
            <rect x="40" y="40" width="8" height="110" />
            <rect x="70" y="55" width="7" height="95" />
            <rect x="175" y="45" width="8" height="105" />
            <rect x="200" y="60" width="7" height="90" />
          </g>
          {/* Birch markings */}
          <line x1="40" y1="65" x2="45" y2="65" stroke="#334155" strokeWidth="1.2" />
          <line x1="43" y1="90" x2="48" y2="90" stroke="#334155" strokeWidth="1.2" />
          <line x1="175" y1="70" x2="180" y2="70" stroke="#334155" strokeWidth="1.2" />
          <line x1="178" y1="100" x2="183" y2="100" stroke="#334155" strokeWidth="1.2" />

          {/* Glowing Paper Lanterns hanging from branches */}
          {/* Left lantern */}
          <line x1="44" y1="45" x2="55" y2="70" stroke="#78350F" strokeWidth="1" />
          <rect x="51" y="70" width="8" height="11" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <circle cx="55" cy="75.5" r="7" fill="#FEF08A" opacity="0.4" />
          {/* Right lantern */}
          <line x1="178" y1="50" x2="165" y2="74" stroke="#78350F" strokeWidth="1" />
          <rect x="161" y="74" width="8" height="11" rx="2" fill="#F87171" stroke="#DC2626" strokeWidth="1" />
          <circle cx="165" cy="79.5" r="7" fill="#FECDD3" opacity="0.4" />

          {/* Wooden Writing Gazebo in clearing */}
          {/* Gazebo Roof */}
          <polygon points="90,85 125,58 160,85" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <polygon points="95,85 125,62 155,85" fill="#B45309" />
          {/* Wooden Posts */}
          <line x1="98" y1="85" x2="98" y2="140" stroke="#78350F" strokeWidth="3" />
          <line x1="152" y1="85" x2="152" y2="140" stroke="#78350F" strokeWidth="3" />
          {/* Deck platform */}
          <rect x="92" y="137" width="66" height="5" rx="1" fill="#78350F" />

          {/* Cedar Desk with Writer & Quill */}
          <rect x="108" y="118" width="34" height="4" fill="#92400E" />
          <line x1="112" y1="122" x2="112" y2="137" stroke="#78350F" strokeWidth="2" />
          <line x1="138" y1="122" x2="138" y2="137" stroke="#78350F" strokeWidth="2" />
          {/* Parchment manuscript */}
          <rect x="115" y="115" width="10" height="3" fill="#FEF3C7" />
          {/* Quill in inkwell */}
          <circle cx="132" cy="116" r="2" fill="#1E293B" />
          <line x1="132" y1="116" x2="136" y2="108" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" />

          {/* Floating illuminated manuscript pages / sparks */}
          <g className="animate-pulse">
            <rect x="80" y="95" width="6" height="8" rx="0.5" fill="#FEF3C7" transform="rotate(15 80 95)" opacity="0.85" />
            <rect x="165" y="105" width="6" height="8" rx="0.5" fill="#FEF3C7" transform="rotate(-20 165 105)" opacity="0.85" />
            <circle cx="95" cy="108" r="1.5" fill="#FEF08A" />
            <circle cx="155" cy="112" r="1.5" fill="#FEF08A" />
            <circle cx="125" cy="98" r="1.5" fill="#FEF08A" />
          </g>
        </svg>
      );

    case 'author-avenue':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Parisian Style Boulevard Buildings */}
          <rect x="10" y="65" width="75" height="85" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Mansard roof */}
          <polygon points="5,65 20,40 75,40 85,65" fill="#475569" />
          {/* Dormer windows */}
          <rect x="35" y="45" width="12" height="15" fill="#E2E8F0" stroke="#334155" strokeWidth="1" />
          {/* Tall arched windows with balconies */}
          <rect x="25" y="75" width="14" height="22" rx="7" fill="#CBD5E1" />
          <rect x="52" y="75" width="14" height="22" rx="7" fill="#CBD5E1" />
          <rect x="20" y="93" width="55" height="3" fill="#1E293B" /> {/* Iron balcony railing */}

          {/* Ornate gas lamppost */}
          <line x1="100" y1="150" x2="100" y2="70" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <path d="M94,70 L106,70 L104,60 L96,60 Z" fill="#FDE047" stroke="#1E293B" strokeWidth="1" />
          <circle cx="100" cy="65" r="7" fill="#FEF08A" opacity="0.3" />

          {/* Author Stone Pedestal with Bronze Bust */}
          <rect x="135" y="112" width="28" height="38" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
          {/* Plaque on pedestal */}
          <rect x="140" y="122" width="18" height="10" fill="#D97706" rx="0.5" />
          <line x1="143" y1="126" x2="155" y2="126" stroke="#78350F" strokeWidth="1" />
          <line x1="143" y1="129" x2="152" y2="129" stroke="#78350F" strokeWidth="0.8" />
          {/* Bronze Bust of Great Thinker */}
          <path d="M143,112 C143,104 146,100 149,100 C152,100 155,104 155,112 Z" fill="#B45309" />
          <circle cx="149" cy="96" r="5" fill="#B45309" />
          <path d="M145,98 C147,100 151,100 153,98" stroke="#78350F" strokeWidth="1" fill="none" />

          {/* Cafe Table with Espresso & Writing Journal */}
          <ellipse cx="195" cy="128" rx="16" ry="5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
          <line x1="195" y1="133" x2="195" y2="150" stroke="#334155" strokeWidth="2" />
          <ellipse cx="195" cy="150" rx="8" ry="2" fill="#334155" />
          {/* Small coffee cup & journal */}
          <rect x="187" y="124" width="7" height="4" fill="#0284C7" rx="0.5" />
          <circle cx="198" cy="126" r="2" fill="#78350F" />
        </svg>
      );

    case 'festival-hills':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Highland Mountain Peaks */}
          <polygon points="10,140 70,60 130,140" fill="#94A3B8" opacity="0.5" />
          <polygon points="60,60 70,60 76,72 64,72" fill="#F8FAFC" /> {/* Snowcap */}
          <polygon points="110,140 170,45 230,140" fill="#64748B" opacity="0.6" />
          <polygon points="158,45 170,45 178,60 162,60" fill="#F8FAFC" /> {/* Snowcap */}

          {/* Hot Air Balloon rising in sky */}
          <g transform="translate(195, 30)">
            {/* Striped Balloon Envelope */}
            <path d="M0,20 C-14,20 -18,6 -18,-6 C-18,-18 -10,-24 0,-24 C10,-24 18,-18 18,-6 C18,6 14,20 0,20 Z" fill="#F43F5E" />
            <path d="M0,20 C-6,20 -8,6 -8,-6 C-8,-18 -4,-24 0,-24 C4,-24 8,-18 8,-6 C8,6 6,20 0,20 Z" fill="#FBBF24" />
            {/* Basket */}
            <rect x="-4" y="24" width="8" height="6" fill="#78350F" rx="0.8" />
            <line x1="-3" y1="20" x2="-3" y2="24" stroke="#451A03" strokeWidth="0.8" />
            <line x1="3" y1="20" x2="3" y2="24" stroke="#451A03" strokeWidth="0.8" />
          </g>

          {/* Main Book Festival Pavilion Tent */}
          {/* Striped Canopy */}
          <polygon points="50,145 105,90 160,145" fill="#EA580C" />
          <polygon points="75,145 105,90 135,145" fill="#FEF08A" />
          <polygon points="95,145 105,90 115,145" fill="#0284C7" />
          {/* Tent Flag on Peak */}
          <line x1="105" y1="90" x2="105" y2="78" stroke="#1E293B" strokeWidth="1.5" />
          <polygon points="105,78 120,83 105,88" fill="#DC2626" />

          {/* Festive Pennant Bunting Banners */}
          <path d="M20,110 Q60,125 105,110 Q150,125 190,110" stroke="#71717A" strokeWidth="1.2" fill="none" />
          {/* Triangular bunting flags */}
          <polygon points="35,115 42,125 49,117" fill="#EF4444" />
          <polygon points="55,119 62,129 69,120" fill="#3B82F6" />
          <polygon points="75,120 82,130 89,119" fill="#10B981" />
          <polygon points="120,119 127,130 134,120" fill="#F59E0B" />
          <polygon points="140,120 147,129 154,118" fill="#8B5CF6" />
          <polygon points="160,117 167,126 174,114" fill="#EC4899" />

          {/* Campfire / Trophy podium */}
          <circle cx="105" cy="155" r="12" fill="#000000" fillOpacity="0.1" />
          <polygon points="100,154 105,145 110,154" fill="#F97316" />
          <polygon points="102,154 105,148 108,154" fill="#FEF08A" />
        </svg>
      );

    case 'ai-knowledge-station':
      return (
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto transition-transform duration-500 ${currentGlowClass} ${className}`}
          aria-hidden="true"
        >
          {/* Mountain Summit Base */}
          <polygon points="0,180 80,125 160,125 240,180" fill="#1E293B" />
          <polygon points="40,140 85,125 155,125 200,140" fill="#334155" />

          {/* Futuristic Observatory Rotunda */}
          {/* Cylindrical Base with illuminated data panels */}
          <rect x="75" y="90" width="90" height="35" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
          {/* Neon vertical circuitry stripes */}
          <line x1="88" y1="94" x2="88" y2="120" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="102" y1="94" x2="102" y2="120" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="138" y1="94" x2="138" y2="120" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="152" y1="94" x2="152" y2="120" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Entrance Airlock */}
          <rect x="110" y="100" width="20" height="25" rx="2" fill="#0284C7" opacity="0.7" />

          {/* Glass Dome with Constellation Astrolabe */}
          <path d="M75,90 C75,50 165,50 165,90 Z" fill="#0284C7" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.8" />
          {/* Dome Ribs */}
          <path d="M90,90 C90,62 150,62 150,90" stroke="#7DD3FC" strokeWidth="1.2" fill="none" opacity="0.6" />
          <path d="M105,90 C105,68 135,68 135,90" stroke="#BAE6FD" strokeWidth="1" fill="none" opacity="0.6" />

          {/* Glowing Holographic Book Knowledge Core */}
          <g transform="translate(120, 68)">
            {/* Ambient Core Glow */}
            <circle cx="0" cy="0" r="16" fill="#38BDF8" fillOpacity="0.25" className="animate-pulse" />
            <circle cx="0" cy="0" r="9" fill="#F0F9FF" fillOpacity="0.9" />
            {/* Orbital Rings */}
            <ellipse cx="0" cy="0" rx="24" ry="7" stroke="#38BDF8" strokeWidth="1.2" fill="none" transform="rotate(-20)" />
            <ellipse cx="0" cy="0" rx="20" ry="6" stroke="#818CF8" strokeWidth="1" fill="none" transform="rotate(35)" />
            {/* Holographic Book Icon in Center */}
            <path d="M-5,-4 C-2,-5 2,-5 5,-4 L5,4 C2,3 -2,3 -5,4 Z" fill="#0284C7" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="0.8" />
            {/* Celestial Sparkles */}
            <circle cx="-16" cy="-12" r="1.5" fill="#FDE047" />
            <circle cx="18" cy="-8" r="1.5" fill="#FDE047" />
            <circle cx="12" cy="14" r="1.2" fill="#38BDF8" />
          </g>

          {/* Starry Night Sky details above summit */}
          <circle cx="45" cy="40" r="1.2" fill="#FEF08A" />
          <circle cx="65" cy="25" r="1" fill="#FEF08A" />
          <circle cx="180" cy="35" r="1.2" fill="#FEF08A" />
          <circle cx="210" cy="20" r="1" fill="#FEF08A" />
        </svg>
      );

    default:
      return null;
  }
};
