import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, Save, RotateCcw, Shirt, Glasses, HardHat, Headphones, BookOpen, Bookmark } from 'lucide-react';
import { useUpdateUserAvatar } from '@/hooks/useUserAvatar';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

export interface BitmojiFeatures {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeShape: string;
  eyeColor: string;
  noseShape: string;
  mouthShape: string;
  outfit: string;
  accessory: string;
  readingAccessory: string;
}

const DEFAULT_AVATAR_FEATURES: BitmojiFeatures = {
  skinTone: '#f4d1ae',
  hairStyle: 'short',
  hairColor: '#8b4513',
  eyeShape: 'normal',
  eyeColor: '#654321',
  noseShape: 'normal',
  mouthShape: 'smile',
  outfit: 'casual',
  accessory: 'none',
  readingAccessory: 'none',
};

const normalizeAvatarFeatures = (value?: unknown): BitmojiFeatures => {
  const settings = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const pick = (candidate: unknown, allowed: readonly string[], fallback: string) =>
    typeof candidate === 'string' && allowed.includes(candidate) ? candidate : fallback;

  return {
    skinTone: pick(settings.skinTone, SKIN_TONES, DEFAULT_AVATAR_FEATURES.skinTone),
    hairStyle: pick(settings.hairStyle, HAIR_STYLES, DEFAULT_AVATAR_FEATURES.hairStyle),
    hairColor: pick(settings.hairColor, HAIR_COLORS, DEFAULT_AVATAR_FEATURES.hairColor),
    eyeShape: pick(settings.eyeShape, EYE_SHAPES, DEFAULT_AVATAR_FEATURES.eyeShape),
    eyeColor: pick(settings.eyeColor, EYE_COLORS, DEFAULT_AVATAR_FEATURES.eyeColor),
    noseShape: pick(settings.noseShape, NOSE_SHAPES, DEFAULT_AVATAR_FEATURES.noseShape),
    mouthShape: pick(settings.mouthShape, MOUTH_SHAPES, DEFAULT_AVATAR_FEATURES.mouthShape),
    outfit: pick(settings.outfit, OUTFITS, DEFAULT_AVATAR_FEATURES.outfit),
    accessory: pick(settings.accessory, ACCESSORIES, DEFAULT_AVATAR_FEATURES.accessory),
    readingAccessory: pick(settings.readingAccessory, READING_ACCESSORIES, DEFAULT_AVATAR_FEATURES.readingAccessory),
  };
};

// Expanded option arrays
const SKIN_TONES = [
  '#f4d1ae', '#deb887', '#d2691e', '#8b4513', '#654321', '#2f1b14',
  '#ffdbac', '#e0ac69', '#c68642', '#a0522d', '#8d5524', '#5d4037',
] as const;

const HAIR_STYLES = [
  'short', 'long', 'curly', 'bald', 'ponytail', 'buzz',
  'wavy', 'bob', 'pixie', 'afro', 'braids', 'dreads',
] as const;

const HAIR_COLORS = [
  '#000000', '#8b4513', '#daa520', '#ff6347', '#9370db', '#32cd32',
  '#1a1a1a', '#5d4037', '#c0c0c0', '#ffd700', '#a0522d', '#8b0000',
] as const;

const EYE_SHAPES = ['normal', 'round', 'narrow', 'wide', 'almond'] as const;

const EYE_COLORS = [
  '#654321', '#4169e1', '#228b22', '#808080', '#800080',
  '#ff69b4', '#ff4500', '#00bfff', '#8b4513', '#006400',
] as const;

const NOSE_SHAPES = ['normal', 'small', 'wide', 'pointed', 'round'] as const;

const MOUTH_SHAPES = ['smile', 'neutral', 'surprised', 'grin', 'open-smile', 'serious'] as const;

const OUTFITS = [
  'casual', 'formal', 'sporty', 'trendy', 'book-lover',
  'cozy', 'vintage', 'academic', 'adventure', 'minimalist',
] as const;

const ACCESSORIES = [
  'none', 'glasses', 'sunglasses', 'hat', 'cap', 'beanie',
  'headphones', 'earrings', 'necklace', 'scarf',
] as const;

const READING_ACCESSORIES = [
  'none', 'book', 'ebook', 'bookmark', 'glasses-reading', 'coffee-book',
] as const;

interface BitmojiCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarData: string) => void;
  initialFeatures?: unknown;
}

export const BitmojiCreator: React.FC<BitmojiCreatorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFeatures,
}) => {
  const [features, setFeatures] = useState<BitmojiFeatures>(() => normalizeAvatarFeatures(initialFeatures));
  const [activeTab, setActiveTab] = useState<'appearance' | 'style' | 'accessories' | 'reading'>('appearance');

  useEffect(() => {
    if (isOpen) setFeatures(normalizeAvatarFeatures(initialFeatures));
  }, [isOpen, initialFeatures]);

  const updateAvatarMutation = useUpdateUserAvatar();

  const updateFeature = useCallback((feature: keyof BitmojiFeatures, value: string) => {
    setFeatures(prev => ({ ...prev, [feature]: value }));
  }, []);

  const resetToDefault = useCallback(() => {
    setFeatures(DEFAULT_AVATAR_FEATURES);
    setActiveTab('appearance');
  }, []);

  // Generate avatar SVG with all features
  const generateAvatarSvg = useCallback(() => {
    const { skinTone, hairStyle, hairColor, eyeShape, eyeColor, noseShape, mouthShape, outfit, accessory, readingAccessory } = features;

    return `
      <svg width="200" height="240" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
          </filter>
        </defs>

        <!-- Body/Outfit Area -->
        ${generateOutfit(outfit, skinTone)}

        <!-- Neck -->
        <path d="M 85 130 Q 100 125 115 130 L 110 140 L 90 140 Z" fill="${skinTone}" filter="url(#shadow)"/>

        <!-- Face -->
        <ellipse cx="100" cy="105" rx="42" ry="48" fill="${skinTone}" filter="url(#shadow)"/>

        <!-- Ears -->
        <ellipse cx="58" cy="105" rx="8" ry="14" fill="${skinTone}" filter="url(#shadow)"/>
        <ellipse cx="142" cy="105" rx="8" ry="14" fill="${skinTone}" filter="url(#shadow)"/>

        <!-- Hair -->
        ${generateHair(hairStyle, hairColor, skinTone)}

        <!-- Eyebrows -->
        ${generateEyebrows(hairColor, eyeShape)}

        <!-- Eyes -->
        ${generateEyes(eyeShape, eyeColor, skinTone)}

        <!-- Nose -->
        ${generateNose(noseShape, skinTone)}

        <!-- Mouth -->
        ${generateMouth(mouthShape, skinTone)}

        <!-- Face Accessories -->
        ${generateFaceAccessories(accessory, hairColor, skinTone)}

        <!-- Reading Accessories -->
        ${generateReadingAccessories(readingAccessory, hairColor, skinTone)}

        <!-- Head Accessories -->
        ${generateHeadAccessories(accessory, hairColor, skinTone)}
      </svg>
    `;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features]);

  // Helper functions for SVG generation
  const generateHair = (style: string, color: string, skinTone: string) => {
    const darkerHair = adjustColor(color, -15);
    const lighterHair = adjustColor(color, 10);

    switch (style) {
      case 'short':
        return `
          <path d="M 58 60 Q 70 45 100 35 Q 130 45 142 60 Q 135 70 110 75 Q 90 75 65 70 Z" fill="${color}"/>
          <path d="M 58 60 Q 70 50 100 42 Q 130 50 142 60" stroke="${darkerHair}" stroke-width="1.5" fill="none"/>
        `;
      case 'long':
        return `
          <path d="M 45 65 Q 70 40 100 30 Q 130 40 155 65 Q 160 100 150 120 Q 140 130 100 135 Q 60 130 50 120 Q 40 100 45 65" fill="${color}"/>
          <path d="M 50 70 Q 75 55 100 45 Q 125 55 150 70" stroke="${darkerHair}" stroke-width="1" fill="none"/>
        `;
      case 'curly':
        return `
          <circle cx="65" cy="55" r="14" fill="${color}"/><circle cx="85" cy="45" r="16" fill="${color}"/>
          <circle cx="105" cy="45" r="16" fill="${color}"/><circle cx="125" cy="55" r="14" fill="${color}"/>
          <circle cx="70" cy="75" r="10" fill="${color}"/><circle cx="100" cy="70" r="12" fill="${color}"/><circle cx="130" cy="75" r="10" fill="${color}"/>
        `;
      case 'ponytail':
        return `
          <path d="M 58 60 Q 70 45 100 35 Q 130 45 142 60 Q 135 70 110 75 Q 90 75 65 70 Z" fill="${color}"/>
          <ellipse cx="135" cy="85" rx="12" ry="25" fill="${color}"/>
          <ellipse cx="135" cy="110" rx="10" ry="20" fill="${darkerHair}"/>
        `;
      case 'buzz':
        return `
          <path d="M 55 55 Q 75 42 100 35 Q 125 42 145 55 Q 145 65 135 70 Q 100 70 65 70 Z" fill="${color}" opacity="0.8"/>
        `;
      case 'wavy':
        return `
          <path d="M 50 60 Q 70 48 90 55 Q 110 48 130 55 Q 150 48 150 65 Q 145 85 130 90 Q 110 85 90 90 Q 70 85 50 85 Z" fill="${color}"/>
          <path d="M 60 65 Q 80 55 100 60 Q 120 55 140 65" stroke="${darkerHair}" stroke-width="1" fill="none"/>
        `;
      case 'bob':
        return `
          <path d="M 55 60 Q 70 45 100 38 Q 130 45 145 60 Q 145 85 140 95 Q 100 100 60 95 Q 55 85 55 60" fill="${color}"/>
          <path d="M 60 70 Q 80 60 100 62 Q 120 60 140 70" stroke="${darkerHair}" stroke-width="1" fill="none"/>
        `;
      case 'pixie':
        return `
          <path d="M 60 58 Q 75 42 100 35 Q 125 42 140 58 Q 138 70 120 72 Q 100 72 80 70 Z" fill="${color}"/>
          <path d="M 80 55 Q 90 48 100 45 Q 110 48 120 55" stroke="${darkerHair}" stroke-width="1" fill="none"/>
        `;
      case 'afro':
        return `
          <ellipse cx="100" cy="55" rx="48" ry="50" fill="${color}"/>
          <circle cx="85" cy="50" r="8" fill="${lighterHair}" opacity="0.5"/>
          <circle cx="115" cy="50" r="8" fill="${lighterHair}" opacity="0.5"/>
          <circle cx="100" cy="35" r="10" fill="${lighterHair}" opacity="0.5"/>
        `;
      case 'braids':
        return `
          <path d="M 60 55 Q 75 40 90 50 Q 75 60 60 55" fill="${color}"/>
          <path d="M 75 55 Q 90 40 105 50 Q 90 60 75 55" fill="${darkerHair}"/>
          <path d="M 95 55 Q 110 40 125 50 Q 110 60 95 55" fill="${color}"/>
          <path d="M 110 55 Q 125 40 140 50 Q 125 60 110 55" fill="${darkerHair}"/>
          <path d="M 80 75 Q 85 85 80 95" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M 120 75 Q 115 85 120 95" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
        `;
      case 'dreads':
        return `
          <rect x="55" y="55" width="12" height="50" rx="6" fill="${color}"/>
          <rect x="72" y="50" width="14" height="55" rx="7" fill="${darkerHair}"/>
          <rect x="91" y="55" width="12" height="50" rx="6" fill="${color}"/>
          <rect x="108" y="50" width="14" height="55" rx="7" fill="${darkerHair}"/>
          <rect x="127" y="55" width="12" height="50" rx="6" fill="${color}"/>
        `;
      default:
        return '';
    }
  };

  const generateEyebrows = (hairColor: string, eyeShape: string) => {
    const browY = eyeShape === 'narrow' ? 88 : 85;
    const browWidth = eyeShape === 'wide' ? 22 : 18;
    const darkerHair = adjustColor(hairColor, -20);
    return `
      <path d="M ${90 - browWidth/2} ${browY} Q 90 ${browY - 4} ${90 + browWidth/2} ${browY}" stroke="${darkerHair}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M ${110 - browWidth/2} ${browY} Q 110 ${browY - 4} ${110 + browWidth/2} ${browY}" stroke="${darkerHair}" stroke-width="3" fill="none" stroke-linecap="round"/>
    `;
  };

  const generateEyes = (shape: string, color: string, skinTone: string) => {
    const eyeY = shape === 'narrow' ? 102 : 100;
    const rx = shape === 'round' ? 10 : shape === 'narrow' ? 12 : shape === 'wide' ? 14 : shape === 'almond' ? 12 : 10;
    const ry = shape === 'round' ? 10 : shape === 'narrow' ? 7 : shape === 'wide' ? 12 : shape === 'almond' ? 10 : 9;

    const white = '#ffffff';
    const darkerSkin = adjustColor(skinTone, -10);

    return `
      <!-- Left Eye White -->
      <ellipse cx="80" cy="${eyeY}" rx="${rx + 2}" ry="${ry + 2}" fill="${white}"/>
      <!-- Right Eye White -->
      <ellipse cx="120" cy="${eyeY}" rx="${rx + 2}" ry="${ry + 2}" fill="${white}"/>
      <!-- Left Eye Iris -->
      <ellipse cx="80" cy="${eyeY}" rx="${rx}" ry="${ry}" fill="${color}"/>
      <!-- Right Eye Iris -->
      <ellipse cx="120" cy="${eyeY}" rx="${rx}" ry="${ry}" fill="${color}"/>
      <!-- Left Pupil -->
      <ellipse cx="80" cy="${eyeY}" rx="${rx * 0.4}" ry="${ry * 0.4}" fill="#1a1a1a"/>
      <!-- Right Pupil -->
      <ellipse cx="120" cy="${eyeY}" rx="${rx * 0.4}" ry="${ry * 0.4}" fill="#1a1a1a"/>
      <!-- Left Eye Highlight -->
      <ellipse cx="76" cy="${eyeY - 2}" rx="2.5" ry="2.5" fill="${white}" opacity="0.9"/>
      <!-- Right Eye Highlight -->
      <ellipse cx="116" cy="${eyeY - 2}" rx="2.5" ry="2.5" fill="${white}" opacity="0.9"/>
      <!-- Eyelids -->
      <path d="M ${80 - rx} ${eyeY - 1} Q 80 ${eyeY - ry - 3} ${80 + rx} ${eyeY - 1}" stroke="${darkerSkin}" stroke-width="1.5" fill="none"/>
      <path d="M ${120 - rx} ${eyeY - 1} Q 120 ${eyeY - ry - 3} ${120 + rx} ${eyeY - 1}" stroke="${darkerSkin}" stroke-width="1.5" fill="none"/>
    `;
  };

  const generateNose = (shape: string, skinTone: string) => {
    const noseColor = adjustColor(skinTone, -12);
    switch (shape) {
      case 'small':
        return `<ellipse cx="100" cy="115" rx="3" ry="4" fill="${noseColor}"/>`;
      case 'wide':
        return `<ellipse cx="100" cy="118" rx="6" ry="5" fill="${noseColor}"/>`;
      case 'pointed':
        return `<path d="M 97 112 Q 100 122 103 112" fill="${noseColor}"/>`;
      case 'round':
        return `<circle cx="100" cy="116" r="5" fill="${noseColor}"/>`;
      default:
        return `<ellipse cx="100" cy="115" rx="4" ry="5" fill="${noseColor}"/>`;
    }
  };

  const generateMouth = (shape: string, skinTone: string) => {
    const mouthColor = '#c0392b';
    const darkerSkin = adjustColor(skinTone, -15);
    switch (shape) {
      case 'neutral':
        return `<line x1="85" y1="135" x2="115" y2="135" stroke="${mouthColor}" stroke-width="2.5" stroke-linecap="round"/>`;
      case 'surprised':
        return `<ellipse cx="100" cy="135" rx="6" ry="10" fill="${mouthColor}"/>`;
      case 'grin':
        return `<path d="M 80 135 Q 100 125 120 135" stroke="${mouthColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'open-smile':
        return `<ellipse cx="100" cy="135" rx="12" ry="8" fill="${mouthColor}"/>
                <ellipse cx="100" cy="135" rx="8" ry="4" fill="${darkerSkin}"/>`;
      case 'serious':
        return `<path d="M 85 135 Q 100 138 115 135" stroke="${mouthColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      default: // smile
        return `<path d="M 82 135 Q 100 145 118 135" stroke="${mouthColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
  };

  const generateOutfit = (outfit: string, skinTone: string) => {
    const colors: Record<string, string> = {
      casual: '#3498db', formal: '#2c3e50', sporty: '#e74c3c',
      trendy: '#9b59b6', 'book-lover': '#8b4513', cozy: '#d4a574',
      vintage: '#8b7355', academic: '#5d4e37', adventure: '#27ae60',
      minimalist: '#ecf0f1',
    };
    const color = colors[outfit] || colors.casual;
    const isLight = outfit === 'minimalist';

    return `
      <!-- Shoulders/Body -->
      <path d="M 50 150 Q 60 140 100 135 Q 140 140 150 150 L 160 220 L 40 220 Z"
            fill="${color}" ${isLight ? 'stroke="#bdc3c7" stroke-width="1"' : ''} filter="url(#shadow)"/>
      <!-- Collar detail for formal -->
      ${outfit === 'formal' ? `
        <path d="M 85 140 L 100 125 L 115 140" fill="none" stroke="#ecf0f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 92 145 L 100 135 L 108 145" fill="none" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round"/>
      ` : ''}
      <!-- Book lover badge -->
      ${outfit === 'book-lover' ? `
        <rect x="75" y="145" width="50" height="18" rx="9" fill="#d4a574" opacity="0.9"/>
        <text x="100" y="158" text-anchor="middle" font-size="11" font-family="system-ui" fill="#4a2c1a" font-weight="600">📚</text>
      ` : ''}
    `;
  };

  const generateFaceAccessories = (accessory: string, hairColor: string, skinTone: string) => {
    const frameColor = adjustColor(hairColor, -20);
    switch (accessory) {
      case 'glasses':
        return `
          <rect x="70" y="90" width="28" height="22" rx="4" fill="none" stroke="${frameColor}" stroke-width="2.5"/>
          <rect x="102" y="90" width="28" height="22" rx="4" fill="none" stroke="${frameColor}" stroke-width="2.5"/>
          <line x1="98" y1="101" x2="102" y2="101" stroke="${frameColor}" stroke-width="2"/>
        `;
      case 'sunglasses':
        return `
          <rect x="68" y="88" width="32" height="26" rx="6" fill="#1a1a1a" opacity="0.8"/>
          <rect x="100" y="88" width="32" height="26" rx="6" fill="#1a1a1a" opacity="0.8"/>
          <line x1="100" y1="101" x2="100" y2="101" stroke="#333" stroke-width="3"/>
        `;
      default:
        return '';
    }
  };

  const generateHeadAccessories = (accessory: string, hairColor: string, skinTone: string) => {
    const frameColor = adjustColor(hairColor, -20);
    switch (accessory) {
      case 'hat':
        return `
          <path d="M 50 45 Q 70 20 100 15 Q 130 20 150 45 Q 155 55 150 65 Q 120 55 100 60 Q 80 55 50 65 Z" fill="#2c3e50"/>
          <ellipse cx="100" cy="45" rx="45" ry="8" fill="#34495e"/>
        `;
      case 'cap':
        return `
          <path d="M 70 55 Q 100 40 130 55 Q 130 65 115 68 Q 100 68 85 68 Q 70 65 70 55" fill="#3498db"/>
          <path d="M 85 55 L 95 40 L 105 55" fill="none" stroke="#2980b9" stroke-width="3" stroke-linecap="round"/>
        `;
      case 'beanie':
        return `
          <ellipse cx="100" cy="30" rx="42" ry="30" fill="#e74c3c"/>
          <ellipse cx="100" cy="50" rx="42" ry="8" fill="#c0392b"/>
          <circle cx="100" cy="15" r="6" fill="#c0392b"/>
        `;
      case 'headphones':
        return `
          <path d="M 50 75 Q 40 70 35 90 Q 30 110 35 130" stroke="${frameColor}" stroke-width="6" fill="none" stroke-linecap="round"/>
          <path d="M 150 75 Q 160 70 165 90 Q 170 110 165 130" stroke="${frameColor}" stroke-width="6" fill="none" stroke-linecap="round"/>
          <circle cx="35" cy="90" r="10" fill="${frameColor}"/>
          <circle cx="165" cy="90" r="10" fill="${frameColor}"/>
          <circle cx="35" cy="90" r="5" fill="${hairColor}"/>
          <circle cx="165" cy="90" r="5" fill="${hairColor}"/>
        `;
      default:
        return '';
    }
  };

  const generateReadingAccessories = (accessory: string, hairColor: string, skinTone: string) => {
    const frameColor = adjustColor(hairColor, -20);
    switch (accessory) {
      case 'book':
        return `
          <g transform="translate(145, 100)">
            <rect x="0" y="0" width="28" height="35" rx="2" fill="#8b4513"/>
            <rect x="2" y="2" width="24" height="31" rx="1" fill="#f5f0e1"/>
            <line x1="14" y1="2" x2="14" y2="33" stroke="#8b4513" stroke-width="1"/>
            <line x1="2" y1="12" x2="26" y2="12" stroke="#e8dcc8" stroke-width="0.5"/>
            <line x1="2" y1="20" x2="26" y2="20" stroke="#e8dcc8" stroke-width="0.5"/>
            <line x1="2" y1="28" x2="26" y2="28" stroke="#e8dcc8" stroke-width="0.5"/>
          </g>
        `;
      case 'ebook':
        return `
          <g transform="translate(145, 100)">
            <rect x="0" y="0" width="30" height="40" rx="3" fill="#1a1a2e" stroke="#16213e" stroke-width="2"/>
            <rect x="3" y="3" width="24" height="34" rx="2" fill="#0f0f23"/>
            <rect x="6" y="8" width="18" height="2" rx="1" fill="#e94560"/>
            <rect x="6" y="16" width="18" height="12" rx="1" fill="#f5f0e1" opacity="0.3"/>
            <line x1="6" y1="30" x2="24" y2="30" stroke="#e94560" stroke-width="1"/>
          </g>
        `;
      case 'bookmark':
        return `
          <g transform="translate(150, 95)">
            <path d="M 0 0 L 12 0 L 6 15 L 0 0" fill="#e74c3c"/>
            <path d="M 1 2 L 11 2 L 6 13 L 1 2" fill="#c0392b"/>
            <rect x="4" y="4" width="4" height="8" rx="1" fill="white" opacity="0.3"/>
          </g>
        `;
      case 'glasses-reading':
        return `
          <rect x="70" y="90" width="28" height="22" rx="4" fill="none" stroke="#8b4513" stroke-width="2.5" stroke-dasharray="3,2"/>
          <rect x="102" y="90" width="28" height="22" rx="4" fill="none" stroke="#8b4513" stroke-width="2.5" stroke-dasharray="3,2"/>
          <line x1="98" y1="101" x2="102" y2="101" stroke="#8b4513" stroke-width="2" stroke-dasharray="2,2"/>
        `;
      case 'coffee-book':
        return `
          <g transform="translate(145, 110)">
            <path d="M 0 15 L 2 0 L 22 0 L 24 15 Z" fill="#d4a574"/>
            <ellipse cx="12" cy="0" rx="12" ry="3" fill="#8b4513"/>
            <path d="M 22 2 Q 28 5 28 10 Q 28 13 22 15" fill="none" stroke="#8b4513" stroke-width="3" stroke-linecap="round"/>
            <rect x="4" y="3" width="4" height="8" rx="1" fill="#f5f0e1" opacity="0.5"/>
          </g>
        `;
      default:
        return '';
    }
  };

  const adjustColor = useCallback((color: string, amount: number) => {
    const num = Number.parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }, []);

  const handleSave = async () => {
    try {
      const avatarSvg = generateAvatarSvg();
      const avatarDataUrl = 'data:image/svg+xml;base64,' + btoa(avatarSvg);

      await updateAvatarMutation.mutateAsync({
        avatar_json: features as any,
        avatar_img_url: avatarDataUrl,
      });

      onSave(avatarDataUrl);
      toast.success('Avatar saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    }
  };

  const tabs = useMemo(() => [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'style', label: 'Hair & Eyes', icon: Shirt },
    { id: 'accessories', label: 'Accessories', icon: Glasses },
    { id: 'reading', label: 'Reading', icon: BookOpen },
  ] as const, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Skin Tone</p>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Skin tone options">
                {SKIN_TONES.map((tone, index) => (
                  <button
                    key={index}
                    role="radio"
                    aria-checked={features.skinTone === tone}
                    className={`w-10 h-10 rounded-full border-3 transition-all ${
                      features.skinTone === tone
                        ? 'border-orange-500 ring-2 ring-orange-200 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: tone }}
                    onClick={() => updateFeature('skinTone', tone)}
                    aria-label={`Skin tone ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Nose Shape</p>
              <div className="grid grid-cols-5 gap-2">
                {NOSE_SHAPES.map((shape) => (
                  <Button
                    key={shape}
                    size="sm"
                    variant={features.noseShape === shape ? "default" : "outline"}
                    onClick={() => updateFeature('noseShape', shape)}
                    className="text-xs h-10"
                  >
                    {shape}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Mouth Shape</p>
              <div className="grid grid-cols-3 gap-2">
                {MOUTH_SHAPES.map((shape) => (
                  <Button
                    key={shape}
                    size="sm"
                    variant={features.mouthShape === shape ? "default" : "outline"}
                    onClick={() => updateFeature('mouthShape', shape)}
                    className="text-xs h-10"
                  >
                    {shape.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Hair Style</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {HAIR_STYLES.map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={features.hairStyle === style ? "default" : "outline"}
                    onClick={() => updateFeature('hairStyle', style)}
                    className="text-xs h-10"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Hair Color</p>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Hair color options">
                {HAIR_COLORS.map((color, index) => (
                  <button
                    key={index}
                    role="radio"
                    aria-checked={features.hairColor === color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      features.hairColor === color
                        ? 'border-orange-500 ring-2 ring-orange-200 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateFeature('hairColor', color)}
                    aria-label={`Hair color ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Eye Shape</p>
              <div className="grid grid-cols-5 gap-2">
                {EYE_SHAPES.map((shape) => (
                  <Button
                    key={shape}
                    size="sm"
                    variant={features.eyeShape === shape ? "default" : "outline"}
                    onClick={() => updateFeature('eyeShape', shape)}
                    className="text-xs h-10"
                  >
                    {shape}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Eye Color</p>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Eye color options">
                {EYE_COLORS.map((color, index) => (
                  <button
                    key={index}
                    role="radio"
                    aria-checked={features.eyeColor === color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      features.eyeColor === color
                        ? 'border-orange-500 ring-2 ring-orange-200 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateFeature('eyeColor', color)}
                    aria-label={`Eye color ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'accessories':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Face & Head Accessories</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ACCESSORIES.map((accessory) => (
                  <Button
                    key={accessory}
                    size="sm"
                    variant={features.accessory === accessory ? "default" : "outline"}
                    onClick={() => updateFeature('accessory', accessory)}
                    className="text-xs h-10 flex flex-col items-center gap-1"
                  >
                    {accessory === 'glasses' && <Glasses className="w-4 h-4" />}
                    {accessory === 'sunglasses' && <Glasses className="w-4 h-4" />}
                    {['hat', 'cap', 'beanie'].includes(accessory) && <HardHat className="w-4 h-4" />}
                    {accessory === 'headphones' && <Headphones className="w-4 h-4" />}
                    {accessory === 'none' && <span className="text-xs">None</span>}
                    {accessory === 'earrings' && <span className="text-xs">✦</span>}
                    {accessory === 'necklace' && <span className="text-xs">◆</span>}
                    {accessory === 'scarf' && <span className="text-xs">🧣</span>}
                    <span className="text-[10px] capitalize">{accessory.replace('-', ' ')}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'reading':
        return (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Reading Accessories</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {READING_ACCESSORIES.map((accessory) => (
                  <Button
                    key={accessory}
                    size="sm"
                    variant={features.readingAccessory === accessory ? "default" : "outline"}
                    onClick={() => updateFeature('readingAccessory', accessory)}
                    className="text-xs h-10 flex flex-col items-center gap-1"
                  >
                    {accessory === 'book' && <BookOpen className="w-4 h-4" />}
                    {accessory === 'ebook' && <span className="text-xs">📱</span>}
                    {accessory === 'bookmark' && <Bookmark className="w-4 h-4" />}
                    {accessory === 'glasses-reading' && <Glasses className="w-4 h-4" />}
                    {accessory === 'coffee-book' && <span className="text-xs">☕📖</span>}
                    {accessory === 'none' && <span className="text-xs">None</span>}
                    <span className="text-[10px] capitalize">{accessory.replace('-', ' ')}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 block">Outfit Style</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {OUTFITS.map((outfit) => (
                  <Button
                    key={outfit}
                    size="sm"
                    variant={features.outfit === outfit ? "default" : "outline"}
                    onClick={() => updateFeature('outfit', outfit)}
                    className="text-xs h-10"
                  >
                    {outfit.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-600" />
            Create Your Reading Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Tab Navigation */}
          <nav className="hidden md:flex flex-col border-r bg-gray-50 p-2 flex-shrink-0" aria-label="Customization categories">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile Tab Bar */}
          <div className="md:hidden border-b bg-gray-50 flex-shrink-0">
            <div className="flex overflow-x-auto px-2 py-2 gap-1" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
              {renderTabContent()}
            </div>

            {/* Preview & Actions - Sticky Bottom */}
            <div className="flex-shrink-0 border-t bg-white p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-center flex-1 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-3">Live Preview</h3>
                  <div className="flex justify-center">
                    <div
                      className="w-40 h-48 md:w-48 md:h-56 rounded-2xl overflow-hidden border-4 border-orange-200 bg-gray-50 shadow-lg"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generateAvatarSvg(), { USE_PROFILES: { svg: true } }) }}
                      role="img"
                      aria-label="Avatar preview"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <Button
                    onClick={handleSave}
                    className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto"
                    disabled={updateAvatarMutation.isPending}
                    size="lg"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {updateAvatarMutation.isPending ? 'Saving...' : 'Save Avatar'}
                  </Button>
                  <Button onClick={resetToDefault} variant="outline" size="lg" className="w-full md:w-auto">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};