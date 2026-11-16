/**
 * Lightweight, deterministic reader portraits for map pins.
 * Generated locally from a stable user seed; no remote avatar service or extra dependency.
 */
const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const createDefaultMapAvatarSvg = (seed: string): string => {
  let state = hashSeed(seed.trim() || 'sahadhyayi-reader');
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

  const skin = pick(['#F3C9A8', '#E4B38D', '#D39A70', '#B97855', '#925B43', '#F0C3A0']);
  const hair = pick(['#211C1A', '#3B2924', '#62402F', '#241F31', '#76513A']);
  const shirt = pick(['#1C442D', '#315A78', '#8A4D3B', '#67558A', '#B16C3D', '#3B6870']);
  const backdrop = pick(['#E6EFE9', '#F3E7D7', '#E6E9F6', '#DDECEF', '#F4E4EA', '#EEE8D8']);
  const face = pick([
    { name: 'oval', path: 'M48 15 C32 15 24 27 24 43 C24 62 35 74 48 75 C61 74 72 62 72 43 C72 27 64 15 48 15Z' },
    { name: 'round', path: 'M48 17 C32 17 22 28 22 46 C22 62 33 74 48 74 C63 74 74 62 74 46 C74 28 64 17 48 17Z' },
    { name: 'square', path: 'M29 31 C29 21 36 17 45 17 H51 C60 17 67 21 67 31 V50 C67 65 59 74 48 76 C37 74 29 65 29 50Z' },
    { name: 'long', path: 'M48 11 C34 11 26 24 26 44 C26 64 35 77 48 80 C61 77 70 64 70 44 C70 24 62 11 48 11Z' },
    { name: 'heart', path: 'M48 76 C40 70 24 54 23 38 C22 25 31 18 41 20 C45 21 47 24 48 28 C49 24 51 21 55 20 C65 18 74 25 73 38 C72 54 56 70 48 76Z' },
  ]);
  const hairStyle = pick(['short', 'curly', 'long', 'bob', 'fade']);
  const hairBack = hairStyle === 'long'
    ? `<path d="M18 42 C15 18 30 7 48 7 C67 7 81 21 78 45 L76 74 Q68 85 62 73 L65 43Z" fill="${hair}"/>`
    : hairStyle === 'bob'
      ? `<path d="M19 44 C17 19 31 8 48 8 C66 8 79 21 77 44 L75 68 Q67 78 63 64 L65 40Z" fill="${hair}"/>`
      : hairStyle === 'curly'
        ? `<path d="M18 43 C16 23 31 8 48 8 C66 8 80 23 78 43Z" fill="${hair}"/><g fill="${hair}"><circle cx="26" cy="25" r="10"/><circle cx="39" cy="15" r="11"/><circle cx="53" cy="14" r="11"/><circle cx="67" cy="24" r="10"/><circle cx="21" cy="37" r="8"/><circle cx="75" cy="37" r="8"/></g>`
        : '';
  const hairFront = hairStyle === 'fade'
    ? `<path d="M23 37 C24 19 34 11 48 11 C62 11 72 19 73 37 C65 30 57 27 48 27 C39 27 31 30 23 37Z" fill="${hair}"/>`
    : hairStyle === 'curly'
      ? ''
      : `<path d="M21 40 C18 21 30 9 48 9 C66 9 78 22 75 40 C68 32 60 28 49 28 C37 28 29 32 21 40Z" fill="${hair}"/>`;
  const glasses = random() > 0.72
    ? '<g fill="none" stroke="#342A27" stroke-width="2.5"><rect x="29" y="43" width="15" height="11" rx="4"/><rect x="52" y="43" width="15" height="11" rx="4"/><path d="M44 47 Q48 44 52 47"/></g>'
    : '';
  const facialHair = random() > 0.78
    ? `<path d="M29 55 Q34 69 48 70 Q62 69 67 55 Q62 63 56 61 L48 65 L40 61 Q34 63 29 55Z" fill="${hair}" opacity=".92"/>`
    : '';

  return `<svg class="sahadhyayi-default-avatar" data-face-shape="${face.name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="100%" height="100%" style="position:absolute;inset:0;display:block;width:100%;height:100%;" aria-hidden="true">
    <defs>
      <clipPath id="reader-avatar-clip"><circle cx="48" cy="48" r="48"/></clipPath>
      <linearGradient id="reader-avatar-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${backdrop}"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".45"/></linearGradient>
    </defs>
    <g clip-path="url(#reader-avatar-clip)">
      <rect width="96" height="96" fill="url(#reader-avatar-bg)"/>
      <circle cx="48" cy="26" r="34" fill="#FFFFFF" opacity=".16"/>
      <path d="M7 98 C10 79 22 73 36 70 L42 67 H54 L60 70 C75 73 86 80 89 98Z" fill="${shirt}"/>
      <path d="M40 63 H56 L58 78 Q48 84 38 78Z" fill="${skin}"/>
      ${hairBack}
      <ellipse cx="22" cy="47" rx="5.5" ry="8" fill="${skin}"/>
      <ellipse cx="74" cy="47" rx="5.5" ry="8" fill="${skin}"/>
      <path d="${face.path}" fill="${skin}" stroke="#6B4938" stroke-opacity=".14" stroke-width="1"/>
      ${hairFront}
      <path d="M34 40 Q39 37 44 40" stroke="${hair}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M52 40 Q57 37 62 40" stroke="${hair}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <ellipse cx="39" cy="47" rx="3.7" ry="4.3" fill="#FFFDF8"/>
      <ellipse cx="57" cy="47" rx="3.7" ry="4.3" fill="#FFFDF8"/>
      <circle cx="40" cy="48" r="2.1" fill="#30241F"/>
      <circle cx="58" cy="48" r="2.1" fill="#30241F"/>
      <circle cx="40.7" cy="47.2" r=".7" fill="#FFFFFF"/>
      <circle cx="58.7" cy="47.2" r=".7" fill="#FFFFFF"/>
      <path d="M48 49 Q45 56 48 58 Q51 58 51 56" stroke="#A66D50" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      ${facialHair}
      <path d="M41 64 Q48 69 55 64" stroke="#9C4F4B" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      ${glasses}
    </g>
  </svg>`;
};
