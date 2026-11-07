import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react';
import { STORY_LIMITS } from '@/config/stories';
import {
  estimateReadingMinutes,
  validatePartTitle,
  validateStoryContent,
} from '@/lib/storyValidation';
import { StoryPart, useCreateStoryPart, useUpdateStoryPart } from '@/hooks/useStories';
import { toast } from 'sonner';

export interface StoryPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyTitle: string;
  partToEdit?: StoryPart | null;
  suggestedPartNumber: number;
  onSuccess?: (partNumber: number) => void;
}

export const StoryPartDialog: React.FC<StoryPartDialogProps> = ({
  open,
  onOpenChange,
  storyId,
  storyTitle,
  partToEdit,
  suggestedPartNumber,
  onSuccess,
}) => {
  const isEditing = Boolean(partToEdit);
  const createPart = useCreateStoryPart();
  const updatePart = useUpdateStoryPart();

  const [partNumber, setPartNumber] = useState<number>(partToEdit?.part_number || suggestedPartNumber);
  const [title, setTitle] = useState(partToEdit?.title || '');
  const [content, setContent] = useState(partToEdit?.content || '');
  const [status, setStatus] = useState<'draft' | 'published'>(partToEdit?.status || 'published');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (partToEdit) {
        setPartNumber(partToEdit.part_number);
        setTitle(partToEdit.title);
        setContent(partToEdit.content || '');
        setStatus(partToEdit.status || 'published');
      } else {
        setPartNumber(suggestedPartNumber);
        setTitle(`Part ${suggestedPartNumber}`);
        setContent('');
        setStatus('published');
      }
    }
  }, [open, partToEdit, suggestedPartNumber]);

  const titleValidation = validatePartTitle(title);
  const contentValidation = validateStoryContent(content);
  const isFormValid = titleValidation.isValid && contentValidation.isValid;
  const estimatedMinutes = estimateReadingMinutes(content);

  const handleSubmit = async (targetStatus?: 'draft' | 'published') => {
    const finalStatus = targetStatus || status;

    if (!titleValidation.isValid) {
      toast.error(titleValidation.error || 'Please enter a valid chapter title.');
      return;
    }
    if (!contentValidation.isValid) {
      toast.error(contentValidation.error || 'Please review chapter content.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && partToEdit) {
        await updatePart.mutateAsync({
          partId: partToEdit.id,
          storyId,
          title,
          content,
          status: finalStatus,
        });
        toast.success('Chapter updated.');
        onSuccess?.(partNumber);
      } else {
        await createPart.mutateAsync({
          storyId,
          partNumber,
          title,
          content,
          status: finalStatus,
        });
        toast.success(`Part ${partNumber} published to series.`);
        onSuccess?.(partNumber);
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to save chapter:', err);
      toast.error(err?.message || 'Unable to save chapter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl border-[#E8E2D9] bg-white p-5 sm:p-7 dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7]">
        <DialogHeader className="pb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
            <Sparkles className="h-5 w-5 text-[#1C442D] dark:text-[#D5B16D]" />
            {isEditing ? `Edit Chapter ${partNumber}` : `Add Chapter ${partNumber}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
            {isEditing ? 'Update this chapter of' : 'Publish a new chapter for'} "{storyTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Part Number & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="part-num" className="text-xs font-semibold">
                Part #
              </Label>
              <Input
                id="part-num"
                type="number"
                min={1}
                max={STORY_LIMITS.MAX_PARTS_PER_SERIES}
                value={partNumber}
                onChange={(e) => setPartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                disabled={isEditing}
                className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="chapter-title" className="text-xs font-semibold">
                  Chapter Title <span className="text-rose-500">*</span>
                </Label>
                <span
                  className={`text-[11px] font-mono ${
                    title.length > STORY_LIMITS.PART_TITLE_MAX ? 'text-rose-600 font-bold' : 'text-[#636B65] dark:text-[#A5ADA6]'
                  }`}
                >
                  {title.length} / {STORY_LIMITS.PART_TITLE_MAX} chars
                </span>
              </div>
              <Input
                id="chapter-title"
                placeholder="e.g. Chapter 2: The Silent River"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={STORY_LIMITS.PART_TITLE_MAX + 10}
                className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D]"
              />
              {!titleValidation.isValid && title.length > 0 && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{titleValidation.error}</p>
              )}
            </div>
          </div>

          {/* Chapter Content & Live Character / Paragraph Monitor */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="chapter-content" className="text-xs font-semibold">
                Chapter Prose <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#636B65] dark:text-[#A5ADA6]">
                  <Clock className="h-3 w-3" /> ~{estimatedMinutes} min read
                </span>
                <span
                  className={
                    content.length > STORY_LIMITS.PART_CONTENT_MAX
                      ? 'text-rose-600 font-bold'
                      : 'text-[#636B65] dark:text-[#A5ADA6]'
                  }
                >
                  {content.length.toLocaleString()} / {STORY_LIMITS.PART_CONTENT_MAX.toLocaleString()} chars
                </span>
              </div>
            </div>

            <Textarea
              id="chapter-content"
              placeholder="Write your chapter here... Separate paragraphs with blank lines. Keep each paragraph under 500 characters for comfortable reading."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="rounded-xl border-[#E8E2D9] font-serif text-sm leading-relaxed p-4 dark:border-[#29332D] resize-y"
            />

            {/* Paragraph feedback */}
            {!contentValidation.isValid && content.length > 0 && (
              <div
                className="flex items-start gap-2 rounded-xl border border-rose-300/60 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{contentValidation.error}</p>
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    Paragraphs must be under {STORY_LIMITS.PARAGRAPH_MAX} characters for optimal mobile flow.
                  </p>
                </div>
              </div>
            )}

            {contentValidation.isValid && content.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6] px-1">
                <span>✓ {contentValidation.paragraphCount} paragraphs well-formatted</span>
                <span>Longest paragraph: {contentValidation.longestParagraphLength} / {STORY_LIMITS.PARAGRAPH_MAX} chars</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] pt-4 dark:border-[#29332D]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || !title.trim()}
                onClick={() => void handleSubmit('draft')}
                className="rounded-xl text-xs h-10 px-4"
              >
                Save Draft
              </Button>

              <Button
                type="button"
                disabled={isSubmitting || !isFormValid}
                onClick={() => void handleSubmit('published')}
                className="gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] rounded-xl text-xs h-10 px-6 font-semibold shadow-sm"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isEditing ? 'Save Changes' : 'Publish Chapter'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

