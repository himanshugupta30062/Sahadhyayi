import React from 'react';

/**
 * Decorative illustrated terrain that gives each stop a distinct place in one
 * continuous storybook landscape. It is intentionally non-interactive.
 */
export const JourneyScenery: React.FC = () => (
  <svg
    className="journey-illustrated-landscape"
    viewBox="0 0 1400 1380"
    preserveAspectRatio="none"
    aria-hidden="true"
    data-testid="journey-illustrated-landscape"
  >
    <defs>
      <linearGradient id="journey-field-back" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D9E5C9" />
        <stop offset="100%" stopColor="#BFD3B0" />
      </linearGradient>
      <linearGradient id="journey-field-front" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#C4D6B1" />
        <stop offset="100%" stopColor="#9EBB91" />
      </linearGradient>
      <linearGradient id="journey-water" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#A7C9C3" />
        <stop offset="50%" stopColor="#D0E0D5" />
        <stop offset="100%" stopColor="#8FBAB2" />
      </linearGradient>
      <linearGradient id="journey-stone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E9D8B7" />
        <stop offset="100%" stopColor="#BBA17B" />
      </linearGradient>
      <linearGradient id="journey-roof" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A66B50" />
        <stop offset="100%" stopColor="#744D3F" />
      </linearGradient>
      <pattern id="journey-map-grain" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="1" fill="#597C55" opacity=".16" />
        <circle cx="19" cy="17" r=".8" fill="#8E7A55" opacity=".12" />
      </pattern>
      <filter id="journey-scene-shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
        <feOffset dy="6" />
        <feComponentTransfer>
          <feFuncA type="linear" slope=".16" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <g id="journey-tree">
        <path d="M0 16 C-3 31 -3 38 -2 48 L5 48 C4 35 5 27 4 16" fill="#806247" />
        <path d="M1 7 C-17 8 -21 -5 -12 -15 C-10 -28 8 -31 16 -19 C30 -13 27 6 12 10 C8 12 4 11 1 7Z" fill="#6D9368" />
        <path d="M-9 -9 C-5 -18 5 -21 13 -13" fill="none" stroke="#A8C59A" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      </g>
      <g id="journey-lantern">
        <path d="M0 0 V8" stroke="#6C5338" strokeWidth="2" />
        <path d="M-6 8 H6 L4 21 H-4Z" fill="#E9B95F" stroke="#936D3F" strokeWidth="1.5" />
        <path d="M-3 11 H3" stroke="#FFF1B5" strokeWidth="2" strokeLinecap="round" />
      </g>
    </defs>

    <g className="journey-landscape-terrain">
      <path d="M0 0 H1400 V1380 H0Z" fill="url(#journey-field-back)" opacity=".25" />
      <path d="M0 125 C180 35 290 95 430 145 C560 190 700 92 830 110 C1040 138 1190 36 1400 105 V0 H0Z" fill="#E8E8C9" opacity=".45" />
      <path d="M0 270 C170 215 275 255 390 310 C540 390 675 235 810 260 C1000 300 1180 225 1400 290 V0 H0Z" fill="url(#journey-field-back)" opacity=".36" />
      <path d="M0 525 C190 450 285 505 430 560 C600 620 760 500 900 520 C1080 545 1230 470 1400 535 V1380 H0Z" fill="#B9D0A9" opacity=".36" />
      <path d="M0 850 C170 790 300 845 420 900 C590 980 720 835 890 865 C1070 895 1240 825 1400 885 V1380 H0Z" fill="url(#journey-field-front)" opacity=".31" />
      <path d="M0 1170 C170 1080 310 1145 460 1200 C640 1270 770 1135 950 1155 C1120 1175 1270 1110 1400 1160 V1380 H0Z" fill="#9DBB8E" opacity=".25" />
      <path d="M0 0 H1400 V1380 H0Z" fill="url(#journey-map-grain)" opacity=".55" />
    </g>

    <g className="journey-landscape-contours" fill="none" stroke="#6E926C" strokeWidth="2" opacity=".18">
      <path d="M-80 205 C150 110 250 180 410 223 S700 285 865 190 S1190 125 1480 220" />
      <path d="M-60 225 C155 140 275 205 420 250 S710 310 878 218 S1200 155 1470 245" />
      <path d="M-70 570 C110 490 245 550 405 612 S700 660 875 574 S1160 520 1470 620" />
      <path d="M-80 600 C120 520 250 580 415 642 S705 688 890 606 S1190 552 1470 650" />
      <path d="M-60 930 C150 850 285 920 440 980 S700 1030 875 936 S1190 890 1460 980" />
      <path d="M-65 960 C150 882 300 950 455 1010 S720 1060 890 970 S1200 920 1470 1010" />
      <path d="M-65 1240 C130 1160 290 1225 445 1280 S730 1340 900 1250 S1200 1190 1470 1280" />
    </g>

    <g className="journey-landscape-water" opacity=".82">
      <path d="M-40 705 C160 660 285 715 410 760 C540 808 635 790 755 750 C905 700 1045 725 1180 775 C1280 815 1360 805 1440 775" fill="none" stroke="#719E94" strokeWidth="28" strokeLinecap="round" opacity=".24" />
      <path d="M-40 700 C160 655 285 710 410 755 C540 803 635 785 755 745 C905 695 1045 720 1180 770 C1280 810 1360 800 1440 770" fill="none" stroke="url(#journey-water)" strokeWidth="18" strokeLinecap="round" />
      <path d="M60 694 C185 670 270 710 390 752 M915 733 C1045 700 1135 742 1250 775" fill="none" stroke="#EDF2DE" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
    </g>

    {/* 01 — a small library quarter beyond the first stop */}
    <g className="journey-landscape-vignette journey-landscape-vignette--library" transform="translate(1030 145)" filter="url(#journey-scene-shadow)">
      <path d="M0 92 H270" stroke="#76916B" strokeWidth="5" strokeLinecap="round" />
      <path d="M20 90 V38 L65 12 L110 38 V90Z" fill="url(#journey-stone)" stroke="#9E8969" strokeWidth="2" />
      <path d="M14 40 L65 7 L116 40" fill="none" stroke="#7E664A" strokeWidth="7" strokeLinejoin="round" />
      <path d="M42 90 V58 Q65 28 88 58 V90Z" fill="#6B8A77" stroke="#F1E5C9" strokeWidth="4" />
      <path d="M130 90 V25 H235 V90Z" fill="#D8C7A5" stroke="#9E8969" strokeWidth="2" />
      <path d="M120 27 L182 0 L245 27" fill="#956C4C" stroke="#74533D" strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 40 H170 V60 H150Z M192 40 H212 V60 H192Z" fill="#67877A" stroke="#F3E8CF" strokeWidth="3" />
      <path d="M165 90 V67 Q182 48 199 67 V90Z" fill="#597568" stroke="#F3E8CF" strokeWidth="3" />
      <path d="M10 94 Q135 112 270 94" fill="none" stroke="#6E986B" strokeWidth="7" strokeLinecap="round" />
      <use href="#journey-tree" transform="translate(262 63) scale(.8)" />
    </g>

    {/* 02 — a reading cottage and old oak */}
    <g className="journey-landscape-vignette journey-landscape-vignette--valley" transform="translate(90 300)" filter="url(#journey-scene-shadow)">
      <use href="#journey-tree" transform="translate(38 48) scale(1.4)" />
      <path d="M90 93 V48 H195 V93Z" fill="#E5D4B2" stroke="#987C57" strokeWidth="2" />
      <path d="M78 50 L141 4 L208 50" fill="url(#journey-roof)" stroke="#6E4B3A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 93 V62 Q143 39 165 62 V93Z" fill="#718F83" stroke="#F3E7CF" strokeWidth="3" />
      <path d="M175 18 V-4 H188 V28" fill="#9A7A5A" />
      <path d="M99 94 Q144 112 213 95" fill="none" stroke="#779B68" strokeWidth="6" strokeLinecap="round" />
      <path d="M225 91 Q245 79 267 89" fill="none" stroke="#A5B78A" strokeWidth="4" strokeLinecap="round" />
      <use href="#journey-tree" transform="translate(260 66) scale(.8)" />
    </g>

    {/* 03 — village cottages, windows and garden lanes */}
    <g className="journey-landscape-vignette journey-landscape-vignette--village" transform="translate(1045 440)" filter="url(#journey-scene-shadow)">
      <path d="M0 95 Q125 115 280 96" fill="none" stroke="#73956A" strokeWidth="8" strokeLinecap="round" />
      <path d="M30 92 V44 H113 V92Z" fill="#E5D2B0" stroke="#9C805D" strokeWidth="2" />
      <path d="M20 47 L72 13 L124 47" fill="url(#journey-roof)" stroke="#7A543C" strokeWidth="3" />
      <path d="M53 92 V62 H83 V92Z" fill="#6E8B7A" stroke="#F1E4C6" strokeWidth="2.5" />
      <path d="M150 92 V30 H226 V92Z" fill="#D6C39F" stroke="#9C805D" strokeWidth="2" />
      <path d="M141 34 L188 1 L236 34" fill="#9B704F" stroke="#76533B" strokeWidth="3" />
      <path d="M170 48 H185 V64 H170Z M198 48 H213 V64 H198Z" fill="#6E8B7A" stroke="#F1E4C6" strokeWidth="2" />
      <use href="#journey-tree" transform="translate(10 66) scale(.7)" />
      <use href="#journey-tree" transform="translate(258 63) scale(.7)" />
    </g>

    {/* 04 — an arched footbridge across the reading river */}
    <g className="journey-landscape-vignette journey-landscape-vignette--bridge" transform="translate(70 580)" filter="url(#journey-scene-shadow)">
      <path d="M0 96 Q120 112 290 96" stroke="#729D91" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M15 75 Q145 -3 276 75" fill="none" stroke="#A58D6A" strokeWidth="23" strokeLinecap="round" />
      <path d="M15 75 Q145 -3 276 75" fill="none" stroke="#E4D2B0" strokeWidth="13" strokeLinecap="round" />
      <path d="M34 70 Q145 7 256 70" fill="none" stroke="#8D7758" strokeWidth="2.5" strokeDasharray="4 6" />
      <path d="M31 75 V86 M63 61 V77 M99 49 V68 M145 42 V62 M190 49 V68 M226 61 V77 M260 75 V86" stroke="#9C8462" strokeWidth="3" />
      <path d="M0 104 Q65 92 130 104 T290 104" stroke="#A0C9BE" strokeWidth="2.5" fill="none" />
      <use href="#journey-tree" transform="translate(8 53) scale(.65)" />
    </g>

    {/* 05 — lantern trail through the forest */}
    <g className="journey-landscape-vignette journey-landscape-vignette--forest" transform="translate(1050 735)" filter="url(#journey-scene-shadow)">
      <path d="M0 105 Q110 70 270 106" fill="none" stroke="#8B9C6E" strokeWidth="8" strokeLinecap="round" />
      <use href="#journey-tree" transform="translate(25 78) scale(1.25)" />
      <use href="#journey-tree" transform="translate(90 66) scale(1.05)" />
      <use href="#journey-tree" transform="translate(220 78) scale(1.25)" />
      <use href="#journey-tree" transform="translate(270 63) scale(.95)" />
      <path d="M65 15 Q145 60 220 15" fill="none" stroke="#A37D56" strokeWidth="2.5" strokeDasharray="3 6" />
      <use href="#journey-lantern" transform="translate(96 30)" />
      <use href="#journey-lantern" transform="translate(178 35) scale(.85)" />
      <path d="M125 85 Q140 55 158 84" fill="none" stroke="#E8D5A3" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* 06 — a literary promenade with a row of reading columns */}
    <g className="journey-landscape-vignette journey-landscape-vignette--authors" transform="translate(78 890)" filter="url(#journey-scene-shadow)">
      <path d="M0 96 Q140 116 294 94" fill="none" stroke="#7B9B72" strokeWidth="7" strokeLinecap="round" />
      <path d="M25 40 H250" stroke="#9E8969" strokeWidth="8" strokeLinecap="round" />
      <path d="M40 43 V91 M93 43 V91 M146 43 V91 M199 43 V91 M244 43 V91" stroke="#D9C8A9" strokeWidth="10" />
      <path d="M31 40 L40 24 L49 40 M84 40 L93 24 L102 40 M137 40 L146 24 L155 40 M190 40 L199 24 L208 40 M235 40 L244 24 L253 40" fill="#A98D68" stroke="#8D7457" strokeWidth="2" />
      <path d="M32 91 H255" stroke="#AD926E" strokeWidth="7" strokeLinecap="round" />
      <path d="M55 62 H77 M108 62 H130 M161 62 H183 M214 62 H236" stroke="#A68150" strokeWidth="2.5" />
      <use href="#journey-tree" transform="translate(280 62) scale(.65)" />
    </g>

    {/* 07 — the festival pavilion and pennant flags */}
    <g className="journey-landscape-vignette journey-landscape-vignette--festival" transform="translate(1055 1060)" filter="url(#journey-scene-shadow)">
      <path d="M0 108 Q140 125 290 104" fill="none" stroke="#829C6D" strokeWidth="7" strokeLinecap="round" />
      <path d="M74 100 V45 H220 V100Z" fill="#E7D6B5" stroke="#9E805A" strokeWidth="2.5" />
      <path d="M57 47 L147 -2 L236 47Z" fill="#B47D4E" stroke="#81583C" strokeWidth="3" />
      <path d="M91 47 V100 M147 47 V100 M203 47 V100" stroke="#A58C68" strokeWidth="5" />
      <path d="M147 -2 V-25" stroke="#806243" strokeWidth="3" />
      <path d="M147 -24 L180 -14 L147 -4Z" fill="#C56E50" />
      <path d="M25 22 Q68 44 105 21 T185 21 T270 20" fill="none" stroke="#8B7050" strokeWidth="2" />
      <path d="M48 28 L59 41 L69 30 M109 22 L120 35 L130 22 M187 22 L198 35 L208 22 M241 21 L251 34 L261 21" fill="#D08A51" />
      <use href="#journey-tree" transform="translate(25 77) scale(.65)" />
      <use href="#journey-tree" transform="translate(270 80) scale(.7)" />
    </g>

    {/* 08 — a quiet observatory at the top of the hill */}
    <g className="journey-landscape-vignette journey-landscape-vignette--observatory" transform="translate(80 1220)" filter="url(#journey-scene-shadow)">
      <path d="M0 100 Q140 124 300 96" fill="none" stroke="#7B9B72" strokeWidth="7" strokeLinecap="round" />
      <path d="M60 94 V58 H236 V94Z" fill="#E1D2B3" stroke="#A38D6B" strokeWidth="2.5" />
      <path d="M45 59 Q147 -22 251 59" fill="#C3D6C9" stroke="#8D9E8A" strokeWidth="3" />
      <path d="M71 58 Q147 -4 225 58" fill="none" stroke="#7E9B89" strokeWidth="4" />
      <path d="M120 94 V70 Q148 47 176 70 V94Z" fill="#607F78" stroke="#F5E9D1" strokeWidth="3" />
      <path d="M148 7 V-17 M137 -6 H159" stroke="#8D7457" strokeWidth="3" strokeLinecap="round" />
      <circle cx="148" cy="15" r="5" fill="#E7C77F" />
      <use href="#journey-tree" transform="translate(27 74) scale(.7)" />
      <use href="#journey-tree" transform="translate(270 73) scale(.7)" />
    </g>
  </svg>
);
