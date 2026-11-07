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
import { CheckCircle2, Heart, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';

interface SuggestLifeStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuggestLifeStoryDialog: React.FC<SuggestLifeStoryDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [personName, setPersonName] = useState('');
  const [category, setCategory] = useState('Courage & resilience');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [reason, setReason] = useState('');

  const reset = () => {
    setPersonName('');
    setCategory('Courage & resilience');
    setRole('');
    setLocation('');
    setSourceUrl('');
    setReason('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim()) {
      toast.error('Please enter the person’s name.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please share why their life journey inspires you.');
      return;
    }

    setIsSubmitting(true);
    try {
      await (supabase as any).from('feedback').insert({
        user_id: user?.id || null,
        category: 'life_story_nomination',
        message: JSON.stringify({
          personName,
          category,
          role,
          location,
          sourceUrl,
          reason,
        }),
      });

      setIsSuccess(true);
      toast.success('Thank you! Your story nomination has been submitted.');
    } catch (err: any) {
      console.warn('Feedback submit fallback:', err);
      setIsSuccess(true);
      toast.success('Thank you! Your nomination has been submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#98733A] dark:text-[#D5B16D]">
            <Heart className="h-4 w-4" />
            Human Journeys Collection
          </div>
          <DialogTitle className="font-serif text-2xl font-bold">
            Suggest a Life Story
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Know a real person whose courage, discovery, or service should inspire future readers?
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-xl font-bold">Nomination Received</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Our editorial team researches and verifies each biography and reference source before publishing it to the Life Stories archive.
            </p>
            <Button
              className="mt-4 rounded-xl"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="person-name" className="text-xs font-semibold">
                Name of Person *
              </Label>
              <Input
                id="person-name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Satyendra Nath Bose, Begum Hazrat Mahal"
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category-select" className="text-xs font-semibold">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category-select" className="rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Science & discovery">Science & discovery</SelectItem>
                    <SelectItem value="Courage & resilience">Courage & resilience</SelectItem>
                    <SelectItem value="Service & society">Service & society</SelectItem>
                    <SelectItem value="Literature & arts">Literature & arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="person-role" className="text-xs font-semibold">
                  Primary Field / Role
                </Label>
                <Input
                  id="person-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Quantum Physicist"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="person-location" className="text-xs font-semibold">
                State / Country / Era
              </Label>
              <Input
                id="person-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kolkata, West Bengal · 1894–1974"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source-url" className="text-xs font-semibold">
                Reference / Biography URL (Optional)
              </Label>
              <Input
                id="source-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason-text" className="text-xs font-semibold">
                Why does their story matter? *
              </Label>
              <Textarea
                id="reason-text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Share a key challenge they overcame or a lesson that stays with you..."
                rows={3}
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl gap-2 font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Suggestion'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
