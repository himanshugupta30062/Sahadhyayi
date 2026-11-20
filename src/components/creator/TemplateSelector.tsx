import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import {
  TemplateStyle,
  TEMPLATE_DEFINITIONS,
} from '@/types/creatorStudio';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  onSelectTemplate: (template: TemplateStyle) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const templates = Object.values(TEMPLATE_DEFINITIONS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Aesthetic Style Presets
        </h4>
        <span className="text-[11px] text-muted-foreground">
          {templates.length} curated styles
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {templates.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl.id)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs relative group overflow-hidden ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-accent/40'
                  : 'border-border/70 hover:border-border hover:bg-accent/20'
              }`}
            >
              {/* Color preview strip */}
              <div
                className="w-full h-8 rounded-md mb-2 flex items-center justify-center border shadow-inner overflow-hidden relative"
                style={{ backgroundColor: tpl.previewColor }}
              >
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm scale-90"
                  style={{
                    backgroundColor: tpl.accentColor,
                    color: tpl.previewColor,
                  }}
                >
                  Aa
                </span>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              {/* Name & Badge */}
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold truncate text-[11px]">{tpl.name}</span>
              </div>

              {/* Description */}
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {tpl.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
