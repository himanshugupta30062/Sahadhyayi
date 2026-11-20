import React, { useState } from 'react';
import {
  Star,
  Plus,
  X,
  AtSign,
  Tag,
  MessageSquare,
  Quote as QuoteIcon,
  HelpCircle,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      {/* Structured Carousel Stage Selector */}
      {postType === 'carousel' && (
        <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Slide Carousel Stage
          </Label>
          <Select
            value={activeSlide.carouselStage || 'hook'}
            onValueChange={(val) => onUpdateSlide({ carouselStage: val as any })}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Select slide stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hook">1. Hook & Cover</SelectItem>
              <SelectItem value="premise">2. Premise / Synopsis</SelectItem>
              <SelectItem value="quotes">3. Key Quote</SelectItem>
              <SelectItem value="breakdown">4. Story Pillar Breakdown</SelectItem>
              <SelectItem value="verdict">5. Final Verdict & Discussion CTA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 1. Rating Selector (if review, wrapup, or verdict) */}
      {(postType === 'review' ||
        postType === 'wrapup' ||
        (postType === 'carousel' && activeSlide.carouselStage === 'verdict')) && (
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
      {(postType === 'review' ||
        (postType === 'carousel' && activeSlide.carouselStage === 'hook')) && (
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

      {/* Carousel Premise / Synopsis */}
      {postType === 'carousel' && activeSlide.carouselStage === 'premise' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Spoiler-Free Premise</Label>
          <Textarea
            value={activeSlide.synopsis || ''}
            onChange={(e) => onUpdateSlide({ synopsis: e.target.value })}
            placeholder="Set up the inciting incident and protagonist dilemma..."
            rows={3}
            className="text-xs resize-none"
          />
        </div>
      )}

      {/* Carousel Verdict Discussion Prompt */}
      {postType === 'carousel' && activeSlide.carouselStage === 'verdict' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Discussion Prompt for Comments
          </Label>
          <Input
            value={activeSlide.discussionQuestion || ''}
            onChange={(e) => onUpdateSlide({ discussionQuestion: e.target.value })}
            placeholder="e.g. Did the ending satisfy you or break your heart?"
            className="text-xs h-9"
          />
        </div>
      )}

      {/* 4. Quote Card Controls */}
      {(postType === 'quote' ||
        (postType === 'carousel' && activeSlide.carouselStage === 'quotes')) && (
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

      {/* Recommendation Companions */}
      {postType === 'recommendation' && (
        <div className="space-y-3 p-3 rounded-xl bg-accent/20 border border-border/50">
          <Label className="text-xs font-semibold">Companion Recommendations</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Book 1</span>
              <Input
                value={activeSlide.recommendedBooks?.[0]?.title || ''}
                onChange={(e) => {
                  const current = activeSlide.recommendedBooks || [{ title: '', author: '' }, { title: '', author: '' }];
                  const updated = [...current];
                  updated[0] = { ...updated[0], title: e.target.value };
                  onUpdateSlide({ recommendedBooks: updated });
                }}
                placeholder="Recommended Title 1"
                className="text-xs h-8"
              />
              <Input
                value={activeSlide.recommendedBooks?.[0]?.author || ''}
                onChange={(e) => {
                  const current = activeSlide.recommendedBooks || [{ title: '', author: '' }, { title: '', author: '' }];
                  const updated = [...current];
                  updated[0] = { ...updated[0], author: e.target.value };
                  onUpdateSlide({ recommendedBooks: updated });
                }}
                placeholder="Author 1"
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-medium text-muted-foreground">Book 2</span>
              <Input
                value={activeSlide.recommendedBooks?.[1]?.title || ''}
                onChange={(e) => {
                  const current = activeSlide.recommendedBooks || [{ title: '', author: '' }, { title: '', author: '' }];
                  const updated = [...current];
                  updated[1] = { ...updated[1], title: e.target.value };
                  onUpdateSlide({ recommendedBooks: updated });
                }}
                placeholder="Recommended Title 2"
                className="text-xs h-8"
              />
              <Input
                value={activeSlide.recommendedBooks?.[1]?.author || ''}
                onChange={(e) => {
                  const current = activeSlide.recommendedBooks || [{ title: '', author: '' }, { title: '', author: '' }];
                  const updated = [...current];
                  updated[1] = { ...updated[1], author: e.target.value };
                  onUpdateSlide({ recommendedBooks: updated });
                }}
                placeholder="Author 2"
                className="text-xs h-8"
              />
            </div>
          </div>
        </div>
      )}

      {/* Book Battle / Versus Opponent Book */}
      {postType === 'versus' && (
        <div className="space-y-2 p-3 rounded-xl bg-accent/20 border border-border/50">
          <Label className="text-xs font-semibold">Opponent Book (Book B)</Label>
          <Input
            value={activeSlide.versus?.bookB?.title || ''}
            onChange={(e) => {
              const currentVersus = activeSlide.versus || {
                bookA: { title: activeSlide.bookTitle || '', author: activeSlide.author || '', score: 5, highlight: '' },
                bookB: { title: '', author: '', score: 5, highlight: '' },
                winner: 'tie',
                verdictNote: '',
              };
              onUpdateSlide({
                versus: {
                  ...currentVersus,
                  bookB: { ...currentVersus.bookB, title: e.target.value },
                },
              });
            }}
            placeholder="Opponent Book Title"
            className="text-xs h-8"
          />
          <Input
            value={activeSlide.versus?.bookB?.author || ''}
            onChange={(e) => {
              const currentVersus = activeSlide.versus || {
                bookA: { title: activeSlide.bookTitle || '', author: activeSlide.author || '', score: 5, highlight: '' },
                bookB: { title: '', author: '', score: 5, highlight: '' },
                winner: 'tie',
                verdictNote: '',
              };
              onUpdateSlide({
                versus: {
                  ...currentVersus,
                  bookB: { ...currentVersus.bookB, author: e.target.value },
                },
              });
            }}
            placeholder="Opponent Author"
            className="text-xs h-8"
          />
        </div>
      )}

      {/* Carousel Story Pillar Scores */}
      {postType === 'carousel' && activeSlide.carouselStage === 'breakdown' && (
        <div className="space-y-2 p-3 rounded-xl bg-accent/20 border border-border/50">
          <Label className="text-xs font-semibold">Pillar Ratings (1-5)</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'plot', label: 'Plot & Intrigue' },
              { key: 'characters', label: 'Character Depth' },
              { key: 'pacing', label: 'Pacing & Rhythm' },
              { key: 'emotionalImpact', label: 'Emotional Resonance' },
            ].map((pillar) => (
              <div key={pillar.key} className="space-y-1">
                <span className="text-[11px] text-muted-foreground block truncate">{pillar.label}</span>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={
                    (activeSlide.ratingBreakdown as any)?.[pillar.key] ??
                    activeSlide.rating ??
                    5
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 5;
                    onUpdateSlide({
                      ratingBreakdown: {
                        plot: activeSlide.ratingBreakdown?.plot ?? 5,
                        characters: activeSlide.ratingBreakdown?.characters ?? 5,
                        pacing: activeSlide.ratingBreakdown?.pacing ?? 4.5,
                        emotionalImpact: activeSlide.ratingBreakdown?.emotionalImpact ?? 5,
                        [pillar.key]: val,
                      },
                    });
                  }}
                  className="text-xs h-8"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carousel Verdict Headline */}
      {postType === 'carousel' && activeSlide.carouselStage === 'verdict' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Verdict Headline</Label>
          <Input
            value={activeSlide.customHeadline || ''}
            onChange={(e) => onUpdateSlide({ customHeadline: e.target.value })}
            placeholder="e.g. Final Verdict: A 5-Star Favorite"
            className="text-xs h-9"
          />
        </div>
      )}

      {/* 5. Wrap-Up Specifics */}
      {postType === 'wrapup' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Month
            </Label>
            <Input
              value={activeSlide.wrapupMonth || 'November'}
              onChange={(e) => onUpdateSlide({ wrapupMonth: e.target.value })}
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" />
              Books Read
            </Label>
            <Input
              type="number"
              value={activeSlide.wrapupBooksCount || 4}
              onChange={(e) => onUpdateSlide({ wrapupBooksCount: parseInt(e.target.value) || 0 })}
              className="text-xs h-8"
            />
          </div>
        </div>
      )}

      {/* 6. Tags & Tropes */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" />
          Tags & Tropes
        </Label>

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

        <div className="flex flex-wrap gap-1">
          {PRESET_TAGS.filter((t) => !activeSlide.tags.includes(t))
            .slice(0, 5)
            .map((preset) => (
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
