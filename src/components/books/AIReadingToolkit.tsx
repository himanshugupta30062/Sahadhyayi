import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookMarked,
  Brain,
  Check,
  Copy,
  ExternalLink,
  Layers,
  LoaderCircle,
  MessageCircleQuestion,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceReading } from '@/hooks/useVoiceReading';

export interface Citation {
  id: string;
  title: string;
  author?: string | null;
  sourceType: string;
  bookId?: string | null;
  pageNumber?: number | null;
  chapterTitle?: string | null;
  url?: string | null;
  excerpt: string;
  similarity?: number;
}

export type BookContext = {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  language?: string | null;
};

interface Props {
  book: BookContext;
}

const ACTIVITIES = [
  {
    id: 'quiz',
    label: 'Test my understanding',
    icon: Brain,
    description: '5-question comprehension quiz with verified answers',
    prompt:
      'Create a 5-question reading comprehension quiz about this book. Ground questions in verified facts and cite sources where available. Include answer explanations after each question.',
  },
  {
    id: 'flashcards',
    label: 'Make flashcards',
    icon: Layers,
    description: '8 study flashcards with core concepts and definitions',
    prompt:
      'Create 8 useful study flashcards about this book in "Question / Answer" format. Ground facts in verified text and highlight major concepts or character arcs.',
  },
  {
    id: 'discussion',
    label: 'Discussion questions',
    icon: MessageCircleQuestion,
    description: 'Book-club discussion prompts & meeting guide',
    prompt:
      'Prepare 8 thoughtful book-club discussion questions for this book, moving from accessible themes to deep ethical and literary interpretations. Avoid unmarked spoilers.',
  },
  {
    id: 'takeaways',
    label: 'Key takeaways',
    icon: BookMarked,
    description: 'Core themes, character reflections, and executive summary',
    prompt:
      'Give a concise reading guide for this book with key takeaways, central themes, character reflections, and practical life applications.',
  },
] as const;

export default function AIReadingToolkit({ book }: Props) {
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { isSupported: isAudioSupported, isPlaying, isPaused, toggle, stop } = useVoiceReading();

  async function generate(activity: (typeof ACTIVITIES)[number]) {
    if (activeActivity) return;
    setActiveActivity(activity.id);
    setResult('');
    setCitations([]);
    setError('');
    stop();

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('book-expert-gemini', {
        body: {
          text: activity.prompt,
          bookContext: {
            id: book.id,
            title: book.title,
            author: book.author ?? null,
            description: book.description ?? null,
            language: book.language ?? null,
          },
        },
      });

      if (invokeError) throw invokeError;
      if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('No response from AI');
      }

      setResult(data.reply);
      if (Array.isArray(data.citations)) {
        setCitations(data.citations);
      }
    } catch {
      setError('The AI activity could not be generated right now. Please try again.');
    } finally {
      setActiveActivity(null);
    }
  }

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <Card id="ai-reading-toolkit" className="mb-6 border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/60 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/20 dark:via-background dark:to-violet-950/20">
      <CardContent className="space-y-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 shadow-xs dark:bg-indigo-900/50 dark:text-indigo-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">AI Reading Toolkit</h2>
              <p className="text-sm text-muted-foreground">
                Interactive quizzes, flashcards, discussion agendas, and audio voice reader.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            AI 2.0
          </Badge>
        </div>

        {/* 4 Activities Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ACTIVITIES.map((activity) => {
            const Icon = activity.icon;
            const isCurrentActive = activeActivity === activity.id;
            return (
              <Button
                key={activity.id}
                type="button"
                variant="outline"
                className="group relative flex h-auto min-h-14 items-center justify-start gap-3 rounded-xl border-border/80 bg-white/80 p-3 text-left transition-all hover:border-indigo-300 hover:bg-white hover:shadow-xs dark:bg-card/70 dark:hover:border-indigo-700"
                disabled={Boolean(activeActivity)}
                onClick={() => void generate(activity)}
              >
                {isCurrentActive ? (
                  <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{activity.label}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{activity.description}</div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Output Section */}
        {result && (
          <section aria-live="polite" className="space-y-4 rounded-xl border border-indigo-200/70 bg-white/95 p-4 shadow-sm sm:p-5 dark:border-indigo-900/50 dark:bg-card/90">
            {/* Action Bar: Title, Audio controls, Copy */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-4 w-4" />
                Generated for {book.title}
              </div>

              <div className="flex items-center gap-1.5">
                {isAudioSupported && (
                  <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/30 px-2 py-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => toggle(result, { lang: book.language === 'hindi' ? 'hi-IN' : 'en-US' })}
                      className="h-7 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted"
                      title={isPlaying && !isPaused ? 'Pause Voice Reading' : 'Listen with Voice Reading'}
                    >
                      {isPlaying && !isPaused ? (
                        <>
                          <Pause className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{isPaused ? 'Resume' : 'Listen'}</span>
                        </>
                      )}
                    </Button>
                    {isPlaying && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={stop}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Stop Voice Reading"
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Content Body */}
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {result}
            </div>

            {/* Page Citations with direct reader links */}
            {citations.length > 0 && (
              <div className="mt-4 border-t border-border/70 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verified Page & Source Citations
                </div>
                <div className="flex flex-wrap gap-2">
                  {citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
                    >
                      <span className="font-bold">[{citation.id}]</span>
                      <span>{citation.title}</span>
                      {citation.pageNumber && (
                        <Link
                          to={`/reader/${book.id}?page=${citation.pageNumber}`}
                          className="inline-flex items-center gap-0.5 rounded font-semibold text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400"
                          title={`Jump to Page ${citation.pageNumber}`}
                        >
                          (p. {citation.pageNumber})
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {citation.chapterTitle && (
                        <span className="text-muted-foreground italic">· {citation.chapterTitle}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground">
          AI responses are grounded in verified Sahadhyayi book metadata, summaries, and indexed text. You can listen aloud in English and Hindi.
        </p>
      </CardContent>
    </Card>
  );
}

