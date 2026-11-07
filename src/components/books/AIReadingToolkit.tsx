import { useState } from "react";
import { BookMarked, Brain, Layers, LoaderCircle, MessageCircleQuestion, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type BookContext = { id: string; title: string; author?: string | null; description?: string | null; language?: string | null };
type Props = { book: BookContext };

const activities = [
  { id: "quiz", label: "Test my understanding", icon: Brain, prompt: "Create a 5-question reading comprehension quiz about this book. Use only verified book content; if only catalog metadata is available, make a clearly labeled general/metadata-based quiz. Include answers and brief explanations after the questions." },
  { id: "flashcards", label: "Make flashcards", icon: Layers, prompt: "Create 8 useful study flashcards about this book in Question / Answer format. Ground book-specific facts in retrieved evidence and clearly mark any general knowledge." },
  { id: "discussion", label: "Discussion questions", icon: MessageCircleQuestion, prompt: "Prepare 8 thoughtful book-club discussion questions, moving from accessible to deeper interpretation. Avoid spoilers unless clearly marked." },
  { id: "takeaways", label: "Key takeaways", icon: BookMarked, prompt: "Give a concise reading guide with key takeaways, themes, and practical reflection prompts. Clearly distinguish verified content from inference." },
] as const;

export default function AIReadingToolkit({ book }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function generate(activity: (typeof activities)[number]) {
    if (active) return;
    setActive(activity.id);
    setResult("");
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("book-expert-gemini", {
        body: {
          text: activity.prompt,
          bookContext: { id: book.id, title: book.title, author: book.author ?? null, description: book.description ?? null, language: book.language ?? null },
        },
      });
      if (invokeError) throw invokeError;
      if (!data || typeof data.reply !== "string" || !data.reply.trim()) throw new Error("No response");
      setResult(data.reply);
    } catch {
      setError("The AI activity could not be generated right now. Please try again.");
    } finally {
      setActive(null);
    }
  }

  return (
    <Card className="mb-6 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700"><Sparkles className="h-5 w-5" /></div>
          <div><h2 className="text-xl font-bold">AI Reading Toolkit</h2><p className="text-sm text-muted-foreground">Turn this book into an interactive learning experience.</p></div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return <Button key={activity.id} variant="outline" className="h-auto min-h-12 justify-start gap-2 whitespace-normal bg-white text-left" disabled={Boolean(active)} onClick={() => void generate(activity)}>
              {active === activity.id ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Icon className="h-4 w-4 shrink-0 text-indigo-600" />}
              {activity.label}
            </Button>;
          })}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {result && <section aria-live="polite" className="rounded-xl border bg-white/90 p-4 sm:p-5"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700"><Sparkles className="h-4 w-4" />Generated for {book.title}</div><div className="whitespace-pre-wrap break-words text-sm leading-6">{result}</div></section>}
        <p className="text-xs text-muted-foreground">AI responses may be imperfect. Book-specific details depend on the sources currently indexed for this title.</p>
      </CardContent>
    </Card>
  );
}
