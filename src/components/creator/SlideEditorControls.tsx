import React, { useState } from 'react';
import { Star, Plus, X, AtSign, Tag, MessageSquare, Quote as QuoteIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SlideData, PostType } from '@/types/creatorStudio';

interface SlideEditorControlsProps {
  activeSlide: SlideData;
  postType: PostType;
  brandWatermarkEnabled: boolean;
  brandWatermarkText: string;
  onUpdateSlide: (updated: Partial<SlideData>) => void;
  onUpdateWatermark: (enabled: boolean, text: string) => void;
}

const PRESET_TAGS = [
  '5 Stars',
  'Must Read',
  'Emotional',
  'Plot Twist',
  'Fast Paced',
  'Book Club Pick',
  'Comfort Read',
  'Dark & Atmospheric',
];

export const SlideEditorControls: React.FC<SlideEditorControlsProps> = ({
  activeSlide,
  postType,
  brandWatermarkEnabled,
  brandWatermarkText,
  onUpdateSlide,
  onUpdateWatermark,
}) => {
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (activeSlide.tags.includes(trimmed)) return;
    onUpdateSlide({ tags: [...activeSlide.tags, trimmed] });
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateSlide({ tags: activeSlide.tags.filter((t) => t !== tagToRemove) });
  };

  return (
    <div className="space-y-4">
      {/* 1. Rating Selector (if review or wrapup) */}
      {(postType === 'review' || postType === 'wrapup') && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center justify-between">
            <span>Your Rating</span>
            <span className="text-muted-foreground font-normal">
              {activeSlide.rating > 0 ? `${activeSlide.rating} of 5 Stars` : 'Unrated'}
            </span>
          </Label>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-accent/30 border border-border/50">
            {[1, 2, 3, 4, 5].map((starVal) => (
              <button
                key={starVal}
                type="button"
                onClick={() =>
                  onUpdateSlide({
                    rating: activeSlide.rating === starVal ? 0 : starVal,
                  })
                }
                className="p-1 rounded hover:scale-110 transition-transform"
                title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
              >
                <Star
                  className={`w-5 h-5 ${
                    starVal <= activeSlide.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/40'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Review Hook / Headline */}
      {postType === 'review' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Catchy Review Hook</Label>
          <Input
            value={activeSlide.hookLine || ''}
            onChange={(e) => onUpdateSlide({ hookLine: e.target.value })}
            placeholder="e.g. A haunting masterpiece that stayed with me for weeks"
            className="text-xs h-9"
          />
        </div>
      )}

      {/* 3. Review Body / Thought */}
      {postType === 'review' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            Review Summary (Concise for Instagram)
          </Label>
          <Textarea
            value={activeSlide.reviewBody || ''}
            onChange={(e) => onUpdateSlide({ reviewBody: e.target.value })}
            placeholder="Share your spoiler-free impressions, themes, writing style, or emotional resonance..."
            rows={3}
            className="text-xs resize-none"
          />
        </div>
      )}

      {/* 4. Quote Card Controls */}
      {postType === 'quote' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <QuoteIcon className="w-3.5 h-3.5" />
              Quote Text
            </Label>
            <Textarea
              value={activeSlide.quote || ''}
              onChange={(e) => onUpdateSlide({ quote: e.target.value })}
              placeholder="Enter the quote text that made you stop and re-read..."
              rows={4}
              className="text-xs resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Attribution (Chapter / Page / Character)</Label>
            <Input
              value={activeSlide.quoteAttribution || ''}
              onChange={(e) => onUpdateSlide({ quoteAttribution: e.target.value })}
              placeholder="e.g. Chapter 4, Page 112"
              className="text-xs h-9"
            />
          </div>
        </>
      )}

      {/* 5. Custom Card Controls */}
      {postType === 'custom' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Headline</Label>
            <Input
              value={activeSlide.customHeadline || ''}
              onChange={(e) => onUpdateSlide({ customHeadline: e.target.value })}
              placeholder="Main Title"
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subtitle</Label>
            <Input
              value={activeSlide.customSubtitle || ''}
              onChange={(e) => onUpdateSlide({ customSubtitle: e.target.value })}
              placeholder="Subtitle or Context"
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Body Content</Label>
            <Textarea
              value={activeSlide.customBody || ''}
              onChange={(e) => onUpdateSlide({ customBody: e.target.value })}
              placeholder="Enter custom content..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </>
      )}

      {/* 6. Tags & Tropes */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" />
          Tags & Tropes
        </Label>

        {/* Selected tags */}
        {activeSlide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeSlide.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-amber-900 dark:hover:text-amber-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Preset quick picks */}
        <div className="flex flex-wrap gap-1">
          {PRESET_TAGS.filter((t) => !activeSlide.tags.includes(t)).slice(0, 5).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddTag(preset)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border/70 hover:bg-accent/40 text-muted-foreground transition-colors"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Custom tag input */}
        <div className="flex items-center gap-1.5 pt-1">
          <Input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(newTagInput);
              }
            }}
            placeholder="Add custom tag..."
            className="text-xs h-8"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddTag(newTagInput)}
            className="h-8 px-2 text-xs"
            disabled={!newTagInput.trim()}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 7. Creator Watermark / Handle */}
      <div className="p-3 rounded-xl bg-accent/20 border border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="watermark-toggle" className="text-xs font-semibold cursor-pointer flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5 text-muted-foreground" />
            Display Creator Handle
          </Label>
          <Switch
            id="watermark-toggle"
            checked={brandWatermarkEnabled}
            onCheckedChange={(checked) => onUpdateWatermark(checked, brandWatermarkText)}
          />
        </div>
        {brandWatermarkEnabled && (
          <Input
            value={brandWatermarkText}
            onChange={(e) => onUpdateWatermark(brandWatermarkEnabled, e.target.value)}
            placeholder="@your_bookstagram_handle"
            className="text-xs h-8"
          />
        )}
      </div>
    </div>
  );
};
