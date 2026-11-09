import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, CheckCircle2, Feather, Heart, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { useCreateStory, useCreateStoryPart } from '@/hooks/useStories';
import { toast } from 'sonner';
import SignInLink from '@/components/SignInLink';

interface WriteLifeStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Courage & resilience',
  'Service & society',
  'Everyday wisdom',
  'Science & discovery',
  'Art & creativity',
  'Education & mentorship',
  'Family & roots',
];

export const WriteLifeStoryDialog: React.FC<WriteLifeStoryDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const createStory = useCreateStory();
  const createStoryPart = useCreateStoryPart();

  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  );
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [years, setYears] = useState('');
  const [category, setCategory] = useState('Courage & resilience');
  const [lesson, setLesson] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reset = () => {
    setTitle('');
    setRole('');
    setLocation('');
    setYears('');
    setCategory('Courage & resilience');
    setLesson('');
    setStoryContent('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to publish your life story.');
      return;
    }

    if (!title.trim()) {
      toast.error('Please give your life story or memoir a title.');
      return;
    }
    if (!authorName.trim()) {
      toast.error('Please provide your name or pen name.');
      return;
    }
    if (!storyContent.trim() || storyContent.trim().length < 50) {
      toast.error('Please share at least 50 characters of your story journey.');
      return;
    }
    if (!lesson.trim()) {
      toast.error('Please share a lesson or thought to carry forward.');
      return;
    }

    setIsSubmitting(true);
    try {
      const summary = `${role ? role + ' · ' : ''}${location ? location + ' — ' : ''}${storyContent.slice(0, 160).trim()}...`;
      
      const newStory = await createStory.mutateAsync({
        title: title.trim(),
        description: summary,
        genre: 'Biography & Memoir',
        tags: ['community-life-story', 'memoir', category.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
        author_name: authorName.trim(),
        story_type: 'standalone',
        status: 'published',
        completion_status: 'completed',
      });

      if (newStory?.id) {
        await createStoryPart.mutateAsync({
          storyId: newStory.id,
          partNumber: 1,
          title: title.trim(),
          content: `${storyContent.trim()}\n\n---\n\n**Lesson to carry forward:**\n${lesson.trim()}`,
          status: 'published',
        });
      }

      setIsSuccess(true);
      toast.success('Your life story has been published to the community!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to create life story:', err);
      toast.error(err?.message || 'Failed to publish story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#98733A] dark:text-[#D5B16D]">
            <Feather className="h-4 w-4" />
            Everyday People, Real Journeys
          </div>
          <DialogTitle className="font-serif text-2xl font-bold">
            Write Your Life Story & Memoir
          </DialogTitle>
          <DialogDescription className="text-sm">
            Share your life journey, crossroads, milestones, and the wisdom you have gathered.
            Every human story enriches our community tapestry.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-8 text-center space-y-4">
            <Heart className="w-12 h-12 text-[#98733A] mx-auto opacity-75" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please sign in to Sahadhyayi to publish your life story, preserve your personal memoirs, and connect with fellow readers.
            </p>
            <div className="pt-2">
              <SignInLink>
                <Button className="rounded-xl font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]">
                  Sign In to Write
                </Button>
              </SignInLink>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-xl font-bold">Your Story is Now Live!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Thank you for sharing your journey. Other readers can now read your memoir, draw inspiration from your wisdom, and celebrate your life path.
            </p>
            <Button
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="rounded-xl bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]"
            >
              Back to Life Stories
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="life-story-title" className="text-xs font-semibold">
                Story Title / Life Chapter *
              </Label>
              <Input
                id="life-story-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. From A Small Town To The Operation Room: Lessons In Empathy"
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="life-story-author" className="text-xs font-semibold">
                  Your Name / Pen Name *
                </Label>
                <Input
                  id="life-story-author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Sunita Devi"
                  className="mt-1 rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="life-story-category" className="text-xs font-semibold">
                  Theme / Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="life-story-category" className="mt-1 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="life-story-role" className="text-xs font-semibold">
                  Role / Life Calling
                </Label>
                <Input
                  id="life-story-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. High school teacher"
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="life-story-location" className="text-xs font-semibold">
                  City / State / Region
                </Label>
                <Input
                  id="life-story-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bhopal, Madhya Pradesh"
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="life-story-years" className="text-xs font-semibold">
                  Time Period / Era
                </Label>
                <Input
                  id="life-story-years"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  placeholder="e.g. 1985–Present"
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="life-story-lesson" className="text-xs font-semibold">
                A Thought or Lesson to Carry Forward *
              </Label>
              <Input
                id="life-story-lesson"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="e.g. Kindness given without expectation always circles back when you need it most."
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="life-story-content" className="text-xs font-semibold">
                Your Life Journey / Story Narrative *
              </Label>
              <Textarea
                id="life-story-content"
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="Write your story here: where you began, the defining moments, challenges you overcame, people who helped you along the way, and what keeps you moving forward..."
                className="mt-1 min-h-[160px] rounded-xl text-sm leading-relaxed"
                required
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Minimum 50 characters. Markdown paragraphs supported.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711] gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Publish Life Story
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

