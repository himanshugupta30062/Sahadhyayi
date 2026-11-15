import type { MapplsPoint } from '@/components/maps/MapplsMap';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const getSafeMediaUrl = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) {
    return null;
  }
  if (trimmed.startsWith('data:image/')) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1) return null;
    const meta = trimmed.slice(0, commaIndex).toLowerCase();
    const payload = trimmed.slice(commaIndex + 1).trim();
    if (!payload) return null;
    const validImageTypes = ['data:image/svg+xml', 'data:image/png', 'data:image/jpeg', 'data:image/jpg', 'data:image/webp', 'data:image/gif'];
    const isBase64 = meta.endsWith(';base64');
    const mime = isBase64 ? meta.slice(0, -7) : meta;
    const isValidMime = validImageTypes.some((t) => mime === t || mime.startsWith(`${t};`));
    if (!isValidMime) return null;
    if (isBase64) {
      return /^[A-Za-z0-9+/=\s_-]+$/.test(payload) ? trimmed : null;
    }
    if (mime.startsWith('data:image/svg+xml')) return trimmed;
    return null;
  }
  if (trimmed.startsWith('<svg')) {
    try {
      const base64Svg = btoa(unescape(encodeURIComponent(trimmed)));
      return `data:image/svg+xml;base64,${base64Svg}`;
    } catch {
      return null;
    }
  }
  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://sahadhyayi.com';
    const url = new URL(trimmed, base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
};

export const createAvatarMarkerHtml = (point: MapplsPoint): string => {
  const avatarUrl = getSafeMediaUrl(point.avatarUrl);
  const isSelf = point.id === 'self';
  const borderColor = isSelf ? '#D5B16D' : '#1C442D';
  const backgroundColor = isSelf ? '#FBF7EE' : '#E8EFE9';
  const primaryColor = isSelf ? '#8F681C' : '#1C442D';
  const glowShadow = isSelf
    ? '0 3px 12px rgba(213,177,109,.55),0 0 0 2px rgba(255,255,255,.96)'
    : '0 3px 12px rgba(20,35,25,.35),0 0 0 2px rgba(255,255,255,.96)';
  const escapedTitle = escapeHtml(point.title);
  const initial = escapeHtml((point.title.trim().charAt(0) || 'R').toUpperCase());

  const imageHtml = avatarUrl
    ? `<img data-sahadhyayi-avatar="true" src="${escapeHtml(avatarUrl)}" alt="" aria-hidden="true" draggable="false" decoding="async" referrerpolicy="no-referrer" style="position:absolute;inset:0;z-index:1;display:block;width:100%;height:100%;object-fit:cover;border-radius:50%;background:transparent;" />`
    : '';

  const youBadgeHtml = isSelf
    ? '<span style="margin-top:1px;padding:1px 5px;border-radius:999px;background:#1C442D;color:#fff;font:700 8px/1.4 system-ui,sans-serif;letter-spacing:.06em;box-shadow:0 1px 4px rgba(0,0,0,.2);border:1px solid #D5B16D;">YOU</span>'
    : '';

  return `<div class="sahadhyayi-reader-map-marker sahadhyayi-marker-${isSelf ? 'self' : 'peer'}" role="img" aria-label="${isSelf ? 'Your reading avatar' : `${escapedTitle} reading avatar`}" title="${escapedTitle}" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:58px;height:68px;overflow:visible;pointer-events:auto;cursor:pointer;user-select:none;">
    <div style="position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:52px;height:52px;padding:3px;border:3px solid ${borderColor};border-radius:50%;background:#fff;box-shadow:${glowShadow};overflow:hidden;">
      <span aria-hidden="true" style="position:absolute;inset:0;display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:50%;background:${backgroundColor};color:${primaryColor};font:700 18px/1 system-ui,sans-serif;">${initial}</span>
      ${imageHtml}
    </div>
    <div aria-hidden="true" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${borderColor};margin-top:-2px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));"></div>
    ${youBadgeHtml}
  </div>`;
};

export const createPlaceMarkerHtml = (point: MapplsPoint): string => {
  const category = (point.category || 'library').toLowerCase();
  const escapedTitle = escapeHtml(point.title);

  let iconEmoji = '🏛️';
  let bgColor = '#1E3A8A'; // Navy blue for libraries
  let badgeText = 'Library';

  if (category.includes('bookstore')) {
    iconEmoji = '📖';
    bgColor = '#B45309'; // Warm amber for bookstores
    badgeText = 'Bookstore';
  } else if (category.includes('cafe')) {
    iconEmoji = '☕';
    bgColor = '#78350F'; // Mocha for cafes
    badgeText = 'Cafe';
  } else if (category.includes('park')) {
    iconEmoji = '🌳';
    bgColor = '#065F46'; // Forest green for parks
    badgeText = 'Park';
  } else if (category.includes('study')) {
    iconEmoji = '💻';
    bgColor = '#334155'; // Slate for study spaces
    badgeText = 'Study';
  }

  return `<div class="sahadhyayi-place-marker" role="img" aria-label="${escapedTitle} (${badgeText})" title="${escapedTitle}" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:50px;height:62px;cursor:pointer;pointer-events:auto;user-select:none;">
    <div style="box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:${bgColor};color:#fff;border:2.5px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.32);font-size:20px;line-height:1;position:relative;">
      <span>${iconEmoji}</span>
    </div>
    <div aria-hidden="true" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${bgColor};margin-top:-2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));"></div>
  </div>`;
};

export const createEventMarkerHtml = (point: MapplsPoint): string => {
  const escapedTitle = escapeHtml(point.title);

  return `<div class="sahadhyayi-event-marker" role="img" aria-label="Literary Event: ${escapedTitle}" title="${escapedTitle}" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:52px;height:64px;cursor:pointer;pointer-events:auto;user-select:none;">
    <div style="box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;width:46px;height:46px;border-radius:14px;background:#9333EA;color:#fff;border:2.5px solid #fff;box-shadow:0 4px 14px rgba(147,51,234,.45);font-size:18px;line-height:1;">
      <span>🎭</span>
      <span style="font-size:8px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;margin-top:2px;">EVENT</span>
    </div>
    <div aria-hidden="true" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #9333EA;margin-top:-2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));"></div>
  </div>`;
};

export const createBookCoverMarkerHtml = (point: MapplsPoint): string => {
  const coverUrl = getSafeMediaUrl(point.avatarUrl);
  const escapedTitle = escapeHtml(point.title);

  const innerCoverHtml = coverUrl
    ? `<img src="${escapeHtml(coverUrl)}" alt="" aria-hidden="true" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />`
    : `<div style="width:100%;height:100%;background:#1C442D;color:#D5B16D;display:flex;align-items:center;justify-content:center;font-size:18px;">📚</div>`;

  return `<div class="sahadhyayi-book-marker" role="img" aria-label="Book: ${escapedTitle}" title="${escapedTitle}" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:48px;height:66px;cursor:pointer;pointer-events:auto;user-select:none;">
    <div style="box-sizing:border-box;width:42px;height:52px;border-radius:5px;border:2px solid #fff;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.25);overflow:hidden;position:relative;">
      ${innerCoverHtml}
    </div>
    <div aria-hidden="true" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #1C442D;margin-top:-2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));"></div>
  </div>`;
};

export const generateMarkerHtml = (point: MapplsPoint): string => {
  const markerType = point.markerType || (point.category ? 'place' : 'avatar');

  switch (markerType) {
    case 'place':
      return createPlaceMarkerHtml(point);
    case 'event':
      return createEventMarkerHtml(point);
    case 'book':
      return createBookCoverMarkerHtml(point);
    case 'avatar':
    default:
      return createAvatarMarkerHtml(point);
  }
};
