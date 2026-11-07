import { useState } from "react";
import { Sparkles, Send, LoaderCircle, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = { book: { id: string; title: string; author?: string | null; description?: string | null; language?: string | null } };

const prompts = ["Explain this book simply", "What are its key themes?", "Give me 5 discussion questions", "Is this book right for me?"];

export default function BookAIReader({ book }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(value = question) {
    const q = value.trim();
    if (!q || busy) return;
    setQuestion(q); setBusy(true); setError(""); setAnswer("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("book-expert-gemini", {
        body: { text: q, bookContext: { id: book.id, title: book.title, author: book.author ?? null, description: book.description ?? null, language: book.language ?? null } },
      });
      if (invokeError) throw invokeError;
      if (!data || typeof data.reply !== "string") throw new Error("No answer received");
      setAnswer(data.reply);
    } catch {
      setError("Book AI is temporarily unavailable. Please try again.");
    } finally { setBusy(false); }
  }
  return <Card id="book-ai" className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm">
    <CardContent className="p-5 sm:p-7 space-y-4">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><Sparkles className="h-5 w-5"/></div><div><h2 className="text-xl font-bold">Ask AI about this book</h2><p className="text-sm text-muted-foreground">Explore ideas, themes and reading questions with Gemini-powered Book Expert.</p></div></div>
      <div className="flex flex-wrap gap-2">{prompts.map(p=><Button key={p} variant="outline" size="sm" className="bg-white" disabled={busy} onClick={()=>ask(p)}>{p}</Button>)}</div>
      <Textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder={`Ask anything about ${book.title}…`} rows={3} maxLength={2000}/>
      <div className="flex justify-end"><Button onClick={()=>ask()} disabled={!question.trim()||busy}>{busy?<LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>:<Send className="mr-2 h-4 w-4"/>}Ask Book AI</Button></div>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      {answer&&<div className="rounded-xl border bg-white/90 p-4 sm:p-5"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700"><BookOpen className="h-4 w-4"/>Book Expert · {book.title}</div><p className="whitespace-pre-wrap text-sm leading-7">{answer}</p></div>}
      <p className="text-xs text-muted-foreground">AI can make mistakes. For full-text questions, answers depend on available licensed/indexed text.</p>
    </CardContent>
  </Card>;
}
