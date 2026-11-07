import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  Pause,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceReading } from '@/hooks/useVoiceReading';

interface Citation {
  id: string;
  title: string;
  author?: string | null;
  sourceType: string;
  bookId?: string | null;
  pageNumber?: number | null;
  chapterTitle?: string | null;
  url?: string | null;
  excerpt: string;
}

type Props = {
  book: {
    id: string;
    title: string;
    author?: string | null;
    description?: string | null;
    language?: string | null;
  };
};

const PROMPTS = [
  'Explain this book simply',
  'What are its key themes and lessons?',
  'Give me 5 thought-provoking questions',
  'Who will enjoy reading this book most?',
];

export default function BookAIReader({ book }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { isSupported: isAudioSupported, isPlaying, isPaused, toggle, stop } = useVoiceReading();

  async function ask(value = question) {
    const q = value.trim();
    if (!q || busy) return;
    setQuestion(q);
    setBusy(true);
    setError('');
    setAnswer('');
    setCitations([]);
    stop();

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('book-expert-gemini', {
        body: {
          text: q,
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
      if (!data || typeof data.reply !== 'string') throw new Error('No answer received');
      setAnswer(data.reply);
      if (Array.isArray(data.citations)) {
        setCitations(data.citations);
      }
    } catch {
      setError('Book AI is temporarily unavailable. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const handleCopy = async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <Card id="book-ai" className="border-violet-200/80 bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/60 shadow-sm dark:border-violet-900/40 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
      <CardContent className="space-y-4 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 shadow-xs dark:bg-violet-900/50 dark:text-violet-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Ask AI about this book</h2>
            <p className="text-sm text-muted-foreground">
              Explore ideas, themes, and reading questions with Gemini-powered Book Expert.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className="bg-white/90 text-xs font-medium hover:border-violet-300 dark:bg-card/70"
              disabled={busy}
              onClick={() => ask(p)}
            >
              {p}
            </Button>
          ))}
        </div>

        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask anything about "${book.title}"…`}
          rows={3}
          maxLength={2000}
          className="border-border/80 bg-white/90 dark:bg-card/90"
        />

        <div className="flex justify-end">
          <Button
            onClick={() => ask()}
            disabled={!question.trim() || busy}
            className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Ask Book AI
          </Button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {answer && (
          <div className="space-y-3 rounded-xl border border-violet-200/80 bg-white/95 p-4 shadow-sm sm:p-5 dark:border-violet-900/50 dark:bg-card/90">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                <BookOpen className="h-4 w-4" />
                Book Expert · {book.title}
              </div>

              <div className="flex items-center gap-1.5">
                {isAudioSupported && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(answer, { lang: book.language === 'hindi' ? 'hi-IN' : 'en-US' })}
                    className="h-8 gap-1.5 px-2 text-xs font-medium"
                    title={isPlaying && !isPaused ? 'Pause Voice Reading' : 'Listen with Voice Reading'}
                  >
                    {isPlaying && !isPaused ? (
                      <>
                        <Pause className="h-3.5 w-3.5 text-violet-600" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-violet-600" />
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
                  className="h-8 gap-1 px-2 text-xs font-medium"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{answer}</p>

            {citations.length > 0 && (
              <div className="mt-3 border-t border-border/70 pt-2.5">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cited Pages & Sources
                </div>
                <div className="flex flex-wrap gap-2">
                  {citations.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
                    >
                      <span className="font-bold">[{c.id}]</span>
                      <span>{c.title}</span>
                      {c.pageNumber && (
                        <Link
                          to={`/reader/${book.id}?page=${c.pageNumber}`}
                          className="inline-flex items-center gap-0.5 font-semibold text-violet-600 underline hover:text-violet-800 dark:text-violet-400"
                          title={`Open Page ${c.pageNumber}`}
                        >
                          (p. {c.pageNumber})
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {c.chapterTitle && <span className="text-muted-foreground italic">· {c.chapterTitle}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          AI answers are generated from verified Sahadhyayi book metadata, summaries, and indexed text.
        </p>
      </CardContent>
    </Card>
  );
}
