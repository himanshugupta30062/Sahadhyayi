import React, { useId, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { STORY_GENRES, STORY_LIMITS, StoryGenre } from '@/config/stories';
import {
  estimateReadingMinutes,
  validatePartTitle,
  validateStoryContent,
  validateStoryDescription,
  validateStoryTags,
  validateStoryTitle,
} from '@/lib/storyValidation';
import { Story, StoryPart, useCreateStory, useCreateStoryPart, useUpdateStory, useUpdateStoryPart } from '@/hooks/useStories';
import { toast } from 'sonner';

interface StoryEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingStory?: Story | null;
  existingParts?: StoryPart[];
}

export const StoryEditorDialog: React.FC<StoryEditorDialogProps> = ({
  open,
  onOpenChange,
  existingStory,
  existingParts = [],
}) => {
  const isEditing = Boolean(existingStory);
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const createPart = useCreateStoryPart();
  const updatePart = useUpdateStoryPart();

  // Story Metadata state
  const [title, setTitle] = useState(existingStory?.title || '');
  const [description, setDescription] = useState(existingStory?.description || '');
  const [coverImageUrl, setCoverImageUrl] = useState(existingStory?.cover_image_url || '');
  const [genre, setGenre] = useState<StoryGenre>((existingStory?.genre as StoryGenre) || 'General');
  const [tags, setTags] = useState<string[]>(existingStory?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [storyType, setStoryType] = useState<'standalone' | 'series'>(
    existingStory?.story_type || 'standalone',
  );
  const [completionStatus, setCompletionStatus] = useState<'ongoing' | 'completed'>(
    existingStory?.completion_status || 'ongoing',
  );

  // Content / First Part state
  const initialPart = existingParts[0];
  const [partTitle, setPartTitle] = useState(initialPart?.title || 'Part 1');
  const [partContent, setPartContent] = useState(initialPart?.content || '');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('published');

  // Series additional parts editor state
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'parts'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation states
  const titleValidation = validateStoryTitle(title);
  const descValidation = validateStoryDescription(description);
  const tagsValidation = validateStoryTags(tags);
  const partTitleValidation = validatePartTitle(partTitle);
  const contentValidation = validateStoryContent(partContent);

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    e?.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    if (tags.length >= STORY_LIMITS.MAX_TAGS) {
      toast.error(`Maximum ${STORY_LIMITS.MAX_TAGS} tags allowed.`);
      return;
    }
    if (tags.includes(cleanTag)) {
      setTagInput('');
      return;
    }
    setTags([...tags, cleanTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const isFormValid =
    titleValidation.isValid &&
    descValidation.isValid &&
    tagsValidation.isValid &&
    partTitleValidation.isValid &&
    contentValidation.isValid;

  const handleSubmit = async (targetStatus?: 'draft' | 'published') => {
    const finalStatus = targetStatus || publishStatus;

    if (!titleValidation.isValid) {
      toast.error(titleValidation.error || 'Please enter a valid title.');
      setActiveTab('details');
      return;
    }
    if (!descValidation.isValid) {
      toast.error(descValidation.error || 'Description is too long.');
      setActiveTab('details');
      return;
    }
    if (!partTitleValidation.isValid) {
      toast.error(partTitleValidation.error || 'Please enter a part title.');
      setActiveTab('content');
      return;
    }
    if (!contentValidation.isValid) {
      toast.error(contentValidation.error || 'Please check story content.');
      setActiveTab('content');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && existingStory) {
        // Update existing story metadata
        await updateStory.mutateAsync({
          storyId: existingStory.id,
          title,
          description,
          cover_image_url: coverImageUrl || null,
          genre,
          tags,
          status: finalStatus,
          completion_status: completionStatus,
        });

        // Update part 1 if exists
        if (initialPart) {
          await updatePart.mutateAsync({
            partId: initialPart.id,
            storyId: existingStory.id,
            title: partTitle,
            content: partContent,
            status: finalStatus,
          });
        }
      } else {
        // Create new story with initial part
        await createStory.mutateAsync({
          title,
          description,
          cover_image_url: coverImageUrl || null,
          genre,
          tags,
          story_type: storyType,
          status: finalStatus,
          completion_status: storyType === 'standalone' ? 'completed' : completionStatus,
          initial_part: {
            title: partTitle,
            content: partContent,
            status: finalStatus,
          },
        });
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error('Story publish failed:', err);
      toast.error(err?.message || 'Unable to save story.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedMinutes = estimateReadingMinutes(partContent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl border-[#E8E2D9] bg-white p-5 sm:p-7 dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7]">
        <DialogHeader className="pb-3 border-b border-[#E8E2D9] dark:border-[#29332D]">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">
            <Sparkles className="h-5 w-5 text-[#1C442D] dark:text-[#D5B16D]" />
            {isEditing ? 'Edit Story' : 'Write a Short Story'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
            Craft standalone short fiction or multi-part serials with clean chapter navigation and reading progress.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-[#FAF7F2] p-1 dark:bg-[#0B0D0C]">
            <TabsTrigger value="details" className="rounded-lg text-xs font-semibold">
              1. Story Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg text-xs font-semibold">
              2. Story Content & Publishing
            </TabsTrigger>
          </TabsList>

          {/* ── STEP 1: Story Details ── */}
          <TabsContent value="details" className="space-y-4 pt-3">
            {/* Story Format */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#636B65] dark:text-[#A5ADA6]">
                Story Format
              </Label>
              <RadioGroup
                value={storyType}
                onValueChange={(v: 'standalone' | 'series') => setStoryType(v)}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div
                  onClick={() => setStoryType('standalone')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${storyType === 'standalone' ? 'border-[#1C442D] bg-[#FAF7F2] dark:border-[#D5B16D] dark:bg-[#1A231D]' : 'border-[#E8E2D9] dark:border-[#29332D]'}`}
                >
                  <RadioGroupItem value="standalone" id="type-standalone" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="type-standalone" className="cursor-pointer text-sm font-semibold">
                      Standalone Story
                    </Label>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                      A complete short story in a single reading experience.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setStoryType('series')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${storyType === 'series' ? 'border-[#1C442D] bg-[#FAF7F2] dark:border-[#D5B16D] dark:bg-[#1A231D]' : 'border-[#E8E2D9] dark:border-[#29332D]'}`}
                >
                  <RadioGroupItem value="series" id="type-series" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="type-series" className="cursor-pointer text-sm font-semibold">
                      Series / Multi-Part
                    </Label>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                      Episodic chapters. Publish parts over time up to {STORY_LIMITS.MAX_PARTS_PER_SERIES} parts.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Title with Character Counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="story-title" className="text-xs font-semibold">
                  Story Title <span className="text-rose-500">*</span>
                </Label>
                <span
                  className={`text-[11px] font-mono ${title.length > STORY_LIMITS.STORY_TITLE_MAX ? 'text-rose-600 font-bold' : 'text-[#636B65] dark:text-[#A5ADA6]'}`}
                >
                  {title.length} / {STORY_LIMITS.STORY_TITLE_MAX} characters
                </span>
              </div>
              <Input
                id="story-title"
                placeholder="e.g. The Monsoon Letter, Shadows in Varanasi..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={STORY_LIMITS.STORY_TITLE_MAX + 15}
                className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D]"
              />
              {!titleValidation.isValid && title.length > 0 && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{titleValidation.error}</p>
              )}
            </div>

            {/* Description with Character Counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="story-description" className="text-xs font-semibold">
                  Short Description
                </Label>
                <span
                  className={`text-[11px] font-mono ${description.length > STORY_LIMITS.STORY_DESCRIPTION_MAX ? 'text-rose-600 font-bold' : 'text-[#636B65] dark:text-[#A5ADA6]'}`}
                >
                  {description.length} / {STORY_LIMITS.STORY_DESCRIPTION_MAX} characters
                </span>
              </div>
              <Textarea
                id="story-description"
                placeholder="A compelling logline or premise that intrigues readers in the feed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={STORY_LIMITS.STORY_DESCRIPTION_MAX + 30}
                rows={3}
                className="rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs resize-none"
              />
              {!descValidation.isValid && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{descValidation.error}</p>
              )}
            </div>

            {/* Genre and Status in grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Genre</Label>
                <Select value={genre} onValueChange={(val: StoryGenre) => setGenre(val)}>
                  <SelectTrigger className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D]">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {STORY_GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {storyType === 'series' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Series Status</Label>
                  <Select
                    value={completionStatus}
                    onValueChange={(val: 'ongoing' | 'completed') => setCompletionStatus(val)}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ongoing">Ongoing (New chapters coming)</SelectItem>
                      <SelectItem value="completed">Completed (Finished series)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tags (Max 5) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="story-tags" className="text-xs font-semibold">
                  Tags ({tags.length} / {STORY_LIMITS.MAX_TAGS})
                </Label>
                <span className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                  Press Enter or click Add
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="story-tags"
                  placeholder="e.g. vintage, rain, mystery..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  disabled={tags.length >= STORY_LIMITS.MAX_TAGS}
                  className="h-9 rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={tags.length >= STORY_LIMITS.MAX_TAGS || !tagInput.trim()}
                  className="h-9 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 rounded-lg px-2 py-0.5 text-xs bg-[#FAF7F2] dark:bg-[#1A231D]"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="cover-url" className="text-xs font-semibold">
                Cover Image URL (Optional)
              </Label>
              <Input
                id="cover-url"
                placeholder="https://images.unsplash.com/photo-..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-xs"
              />
              <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                An artistic cover is automatically generated with your story title if omitted.
              </p>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="button"
                onClick={() => setActiveTab('content')}
                disabled={!titleValidation.isValid || !descValidation.isValid}
                className="gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] rounded-xl text-xs h-10 px-5"
              >
                Proceed to Content →
              </Button>
            </div>
          </TabsContent>

          {/* ── STEP 2: Content & Publishing ── */}
          <TabsContent value="content" className="space-y-4 pt-3">
            {/* Part Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="part-title" className="text-xs font-semibold">
                  {storyType === 'series' ? 'Chapter / Part Title' : 'Story Subtitle or Opening'}
                </Label>
                <span
                  className={`text-[11px] font-mono ${partTitle.length > STORY_LIMITS.PART_TITLE_MAX ? 'text-rose-600 font-bold' : 'text-[#636B65] dark:text-[#A5ADA6]'}`}
                >
                  {partTitle.length} / {STORY_LIMITS.PART_TITLE_MAX} characters
                </span>
              </div>
              <Input
                id="part-title"
                placeholder={storyType === 'series' ? 'Part 1: The Departure' : 'Complete Short Story'}
                value={partTitle}
                onChange={(e) => setPartTitle(e.target.value)}
                maxLength={STORY_LIMITS.PART_TITLE_MAX + 15}
                className="h-10 rounded-xl border-[#E8E2D9] dark:border-[#29332D]"
              />
              {!partTitleValidation.isValid && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{partTitleValidation.error}</p>
              )}
            </div>

            {/* Part Content & Live Character / Paragraph Monitor */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="part-content" className="text-xs font-semibold">
                  Story Prose <span className="text-rose-500">*</span>
                </Label>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-[#636B65] dark:text-[#A5ADA6]">
                    <Clock className="h-3 w-3" /> ~{estimatedMinutes} min read
                  </span>
                  <span
                    className={
                      partContent.length > STORY_LIMITS.PART_CONTENT_MAX
                        ? 'text-rose-600 font-bold'
                        : 'text-[#636B65] dark:text-[#A5ADA6]'
                    }
                  >
                    {partContent.length.toLocaleString()} / {STORY_LIMITS.PART_CONTENT_MAX.toLocaleString()} characters
                  </span>
                </div>
              </div>

              <Textarea
                id="part-content"
                placeholder="Write your story here... Separate paragraphs with natural line breaks (blank lines). Each paragraph should be under 500 characters for comfortable reading flow."
                value={partContent}
                onChange={(e) => setPartContent(e.target.value)}
                rows={12}
                className="rounded-xl border-[#E8E2D9] font-serif text-sm leading-relaxed p-4 dark:border-[#29332D] resize-y"
              />

              {/* Real-time paragraph feedback */}
              {!contentValidation.isValid && partContent.length > 0 && (
                <div
                  className="flex items-start gap-2 rounded-xl border border-rose-300/60 bg-rose-50/70 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{contentValidation.error}</p>
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                      Sahadhyayi keeps reading comfortable on mobile screens by ensuring single continuous blocks of text do not exceed {STORY_LIMITS.PARAGRAPH_MAX} characters.
                    </p>
                  </div>
                </div>
              )}

              {contentValidation.isValid && partContent.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-[#636B65] dark:text-[#A5ADA6] px-1">
                  <span>✓ {contentValidation.paragraphCount} paragraphs well-formatted</span>
                  <span>Longest paragraph: {contentValidation.longestParagraphLength} / {STORY_LIMITS.PARAGRAPH_MAX} chars</span>
                </div>
              )}
            </div>

            {/* Publishing Action Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] pt-4 dark:border-[#29332D]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('details')}
                className="rounded-xl"
              >
                ← Back to Overview
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || !title.trim()}
                  onClick={() => void handleSubmit('draft')}
                  className="rounded-xl text-xs h-10 px-4"
                >
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting || !isFormValid}
                  onClick={() => void handleSubmit('published')}
                  className="gap-2 bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c49f5c] rounded-xl text-xs h-10 px-6 font-semibold shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isEditing ? 'Save Changes' : 'Publish Story'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
