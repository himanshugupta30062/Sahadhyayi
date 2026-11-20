import React from 'react';
import { Check, Sparkles, Type, Layers } from 'lucide-react';
import {
  TemplateStyle,
  TEMPLATE_DEFINITIONS,
  BackgroundTexture,
  FontPairing,
} from '@/types/creatorStudio';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  selectedTexture?: BackgroundTexture;
  selectedFont?: FontPairing;
  onSelectTemplate: (template: TemplateStyle) => void;
  onSelectTexture?: (texture: BackgroundTexture) => void;
  onSelectFont?: (font: FontPairing) => void;
}

const TEXTURES: { id: BackgroundTexture; label: string }[] = [
  { id: 'clean', label: 'Smooth Solid' },
  { id: 'parchment', label: 'Aged Parchment' },
  { id: 'dots', label: 'Subtle Stipple' },
  { id: 'linen', label: 'Fine Linen' },
  { id: 'gradient', label: 'Sunset Glow' },
];

const FONTS: { id: FontPairing; label: string; preview: string }[] = [
  { id: 'editorial', label: 'Editorial Serif', preview: 'Playfair + Inter' },
  { id: 'literary', label: 'Literary Classic', preview: 'Garamond + Georgia' },
  { id: 'modern', label: 'Modern Aesthetic', preview: 'Jakarta + Sans' },
  { id: 'heritage', label: 'Desi Heritage', preview: 'Indic Serif + Sans' },
  { id: 'bold', label: 'Bold Contemporary', preview: 'Grotesk Display' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  selectedTexture = 'clean',
  selectedFont = 'editorial',
  onSelectTemplate,
  onSelectTexture,
  onSelectFont,
}) => {
  const templates = Object.values(TEMPLATE_DEFINITIONS);

  return (
    <div className="space-y-5">
      {/* 1. Core Visual Style Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Aesthetic Presets
          </h4>
          <span className="text-[11px] text-muted-foreground">
            {templates.length} styles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs relative group overflow-hidden ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-accent/40'
                    : 'border-border/70 hover:border-border hover:bg-accent/20'
                }`}
              >
                {/* Color preview strip */}
                <div
                  className="w-full h-7 rounded-md mb-1.5 flex items-center justify-center border shadow-inner overflow-hidden relative"
                  style={{ backgroundColor: tpl.previewColor }}
                >
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.2 rounded shadow-sm scale-90"
                    style={{
                      backgroundColor: tpl.accentColor,
                      color: tpl.previewColor,
                    }}
                  >
                    Aa
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                      <Check className="w-2 h-2" />
                    </div>
                  )}
                </div>

                <span className="font-semibold truncate text-[11px] block">{tpl.name}</span>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {tpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Background Texture Overlays */}
      {onSelectTexture && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Paper & Texture Effect
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {TEXTURES.map((tex) => (
              <button
                key={tex.id}
                type="button"
                onClick={() => onSelectTexture(tex.id)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  selectedTexture === tex.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent/40 hover:text-foreground'
                }`}
              >
                {tex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Typography & Font Pairings */}
      {onSelectFont && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-amber-500" />
            Font Pairings
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => onSelectFont(font.id)}
                className={`text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  selectedFont === font.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                    : 'border-border/70 hover:bg-accent/20 text-muted-foreground'
                }`}
              >
                <div>
                  <span className="font-semibold block text-[11px]">{font.label}</span>
                  <span className="text-[10px] opacity-75">{font.preview}</span>
                </div>
                {selectedFont === font.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
