import { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  ListOrdered,
  LoaderCircle,
  MessageSquare,
  Pause,
  Play,
  Share2,
  Sparkles,
  Users,
  Volume2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useVoiceReading } from '@/hooks/useVoiceReading';

interface Props {
  initialBookTitle?: string;
  groupName?: string;
}

const TEMPLATES = [
  {
    id: 'schedule',
    label: '4-Week Reading Schedule',
    icon: Calendar,
    description: 'Paced milestones, weekly targets, and reading goals',
    makePrompt: (title: string, group: string) =>
      `Create a balanced 4-week reading schedule for a reading group called "${group}" reading "${title}". 
Provide weekly page/chapter targets, discussion checkpoints, and gentle pacing tips to help everyone finish without falling behind.`,
  },
  {
    id: 'agenda',
    label: '60-Minute Meeting Agenda',
    icon: Clock,
    description: 'Step-by-step meeting flow from icebreaker to debate',
    makePrompt: (title: string, group: string) =>
      `Create a structured 60-minute meeting agenda for the book club "${group}" discussing "${title}". 
Include: 
1. 10m Icebreaker & first impressions
2. 20m Core themes & favorite quotes
3. 20m Deep thematic debate & character choices
4. 10m Takeaways & next book selection.`,
  },
  {
    id: 'questions',
    label: 'Discussion Prompts & Icebreakers',
    icon: MessageSquare,
    description: '6 lively debate prompts and spoiler-free icebreakers',
    makePrompt: (title: string, group: string) =>
      `Generate 6 thoughtful, debate-provoking discussion questions for book group "${group}" reading "${title}". 
Include 2 fun warm-up icebreakers, 2 character psychology questions, and 2 deep philosophical/thematic dilemmas. Avoid unmarked spoilers.`,
  },
] as const;

export default function AIReadingGroupAssistant({ initialBookTitle = '', groupName = 'Reading Group' }: Props) {
  const [bookTitle, setBookTitle] = useState(initialBookTitle);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { isSupported: isAudioSupported, isPlaying, isPaused, toggle, stop } = useVoiceReading();

  const generatePlan = async (template: (typeof TEMPLATES)[number]) => {
    const titleToUse = bookTitle.trim() || 'our current club book';
    setActiveTemplate(template.id);
    setOutput('');
    setError('');
    stop();

    try {
      const prompt = template.makePrompt(titleToUse, groupName);
      const { data, error: invokeError } = await supabase.functions.invoke('book-expert-gemini', {
        body: { text: prompt },
      });

      if (invokeError) throw invokeError;
      if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('No answer received');
      }

      setOutput(data.reply);
    } catch {
      setError('Could not generate group guide right now. Please try again.');
    } finally {
      setActiveTemplate(null);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/60 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 shadow-xs dark:bg-emerald-900/50 dark:text-emerald-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground">AI Reading Group Assistant</h3>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Organizer AI
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Generate tailored reading schedules, meeting agendas, and debate questions for your club.
              </p>
            </div>
          </div>
        </div>

        {/* Book Title Input */}
        <div className="space-y-1.5">
          <label htmlFor="group-book-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Book for this activity:
          </label>
          <Input
            id="group-book-title"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder='e.g. "Godaan by Premchand" or "Atomic Habits"'
            className="h-10 border-border/80 bg-white dark:bg-card/90"
          />
        </div>

        {/* 3 AI Actions */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isActive = activeTemplate === tmpl.id;
            return (
              <Button
                key={tmpl.id}
                type="button"
                variant="outline"
                disabled={Boolean(activeTemplate)}
                onClick={() => void generatePlan(tmpl)}
                className="group flex h-auto min-h-14 flex-col items-start justify-start gap-1 rounded-xl border-border/80 bg-white/80 p-3 text-left transition-all hover:border-emerald-300 hover:bg-white hover:shadow-xs dark:bg-card/70 dark:hover:border-emerald-700"
              >
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="text-xs font-bold text-foreground">{tmpl.label}</span>
                </div>
                <span className="line-clamp-2 text-[11px] text-muted-foreground">{tmpl.description}</span>
              </Button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </p>
        )}

        {/* Result */}
        {output && (
          <div className="space-y-3 rounded-xl border border-emerald-200/80 bg-white/95 p-4 shadow-xs sm:p-5 dark:border-emerald-900/50 dark:bg-card/90">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Plan for {bookTitle || 'Club Discussion'}
              </div>

              <div className="flex items-center gap-1.5">
                {isAudioSupported && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(output)}
                    className="h-7 gap-1 px-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    {isPlaying && !isPaused ? (
                      <>
                        <Pause className="h-3 w-3 text-emerald-600" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3 text-emerald-600" />
                        <span>{isPaused ? 'Resume' : 'Listen'}</span>
                      </>
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-7 gap-1 px-2 text-xs font-medium"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground sm:text-sm">
              {output}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

