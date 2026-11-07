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
import { Switch } from '@/components/ui/switch';
import { CalendarDays, CheckCircle2, Globe2, Loader2, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from 'sonner';

interface SuggestEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSubmitted?: () => void;
}

export const SuggestEventDialog: React.FC<SuggestEventDialogProps> = ({
  open,
  onOpenChange,
  onEventSubmitted,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('literature-festival');
  const [organizerName, setOrganizerName] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setTitle('');
    setCategory('literature-festival');
    setOrganizerName('');
    setIsOnline(false);
    setCity('');
    setVenue('');
    setStartDate('');
    setRegistrationUrl('');
    setOfficialSourceUrl('');
    setDescription('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter the event title.');
      return;
    }
    if (!startDate) {
      toast.error('Please specify the event date.');
      return;
    }
    if (!officialSourceUrl.trim()) {
      toast.error('Please provide an official website or announcement link.');
      return;
    }
    if (!isOnline && !city.trim()) {
      toast.error('Please specify the city for in-person events.');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

      // Attempt to record in literary_events as draft
      const { error: dbError } = await (supabase as any).from('literary_events').insert({
        title: title.trim(),
        slug,
        category_id: category,
        description: description.trim() || null,
        organizer_name: organizerName.trim() || null,
        is_online: isOnline,
        city: isOnline ? 'Online' : city.trim(),
        venue: isOnline ? 'Virtual' : (venue.trim() || city.trim()),
        start_at: new Date(startDate).toISOString(),
        official_source_url: officialSourceUrl.trim(),
        registration_url: registrationUrl.trim() || null,
        status: 'draft',
        verification_status: 'unverified',
        created_by: user?.id || null,
      });

      if (dbError) {
        console.warn('Direct literary_events draft insert note:', dbError.message);
        // Also capture in feedback as fallback
        await (supabase as any).from('feedback').insert({
          user_id: user?.id || null,
          category: 'event_suggestion',
          message: JSON.stringify({
            title,
            category,
            organizerName,
            isOnline,
            city,
            venue,
            startDate,
            registrationUrl,
            officialSourceUrl,
            description,
          }),
        });
      }

      setIsSuccess(true);
      toast.success('Thank you! Your event suggestion has been submitted for review.');
      if (onEventSubmitted) onEventSubmitted();
    } catch (err: any) {
      console.error('Failed to submit event suggestion:', err);
      toast.error(err?.message || 'Could not submit event. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            Community Event Submissions
          </div>
          <DialogTitle className="font-serif text-2xl font-bold">
            Suggest a Book or Literary Event
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Help Indian readers discover book fairs, literature festivals, author talks, and reading meetups.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-xl font-bold">Event Received!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Our team verifies every event against its official source URL before featuring it on the community calendar. Thank you for contributing!
            </p>
            <Button
              className="mt-4 rounded-xl"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="event-title" className="text-xs font-semibold">
                Event Title *
              </Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pune Book Festival 2027"
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-category" className="text-xs font-semibold">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="event-category" className="rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="literature-festival">Literature Festival</SelectItem>
                    <SelectItem value="book-fair">Book Fair & Expo</SelectItem>
                    <SelectItem value="author-talk">Author Talk / Panel</SelectItem>
                    <SelectItem value="book-launch">Book Launch</SelectItem>
                    <SelectItem value="workshop">Writing Workshop</SelectItem>
                    <SelectItem value="reader-meetup">Reader Meetup</SelectItem>
                    <SelectItem value="online">Online Event</SelectItem>
                    <SelectItem value="booktech">BookTech & AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-date" className="text-xs font-semibold">
                  Date & Time *
                </Label>
                <Input
                  id="event-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3 bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="is-online" className="text-xs font-semibold cursor-pointer">
                  Is this a Virtual / Online Event?
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Webinars, live author streams, or digital book club sessions
                </p>
              </div>
              <Switch
                id="is-online"
                checked={isOnline}
                onCheckedChange={setIsOnline}
              />
            </div>

            {!isOnline && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-city" className="text-xs font-semibold">
                    City *
                  </Label>
                  <Input
                    id="event-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Jaipur, Kolkata"
                    required={!isOnline}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-venue" className="text-xs font-semibold">
                    Venue Name
                  </Label>
                  <Input
                    id="event-venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Fergusson College Grounds"
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="organizer-name" className="text-xs font-semibold">
                Organizer / Host Name
              </Label>
              <Input
                id="organizer-name"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g. National Book Trust, Crossword, Local Reading Circle"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="official-url" className="text-xs font-semibold">
                  Official Website / Announcement URL *
                </Label>
                <Input
                  id="official-url"
                  type="url"
                  value={officialSourceUrl}
                  onChange={(e) => setOfficialSourceUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-url" className="text-xs font-semibold">
                  Registration / Ticket Link (Optional)
                </Label>
                <Input
                  id="reg-url"
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-desc" className="text-xs font-semibold">
                Event Description
              </Label>
              <Textarea
                id="event-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give readers a quick summary of what to expect, featured guests, and sessions..."
                rows={3}
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
                className="rounded-xl gap-2 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Event'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

