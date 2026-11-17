import { useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, RefreshCw, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMatrixPuzzle, type MatrixDifficulty } from "@/lib/brain/matrixGenerator";
import MatrixTile from "@/components/brain/MatrixTile";

const DIFFICULTY_LABELS: Record<MatrixDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export default function BrainMatrixPractice() {
  const [difficulty, setDifficulty] = useState<MatrixDifficulty>("easy");
  const [puzzle, setPuzzle] = useState(() => generateMatrixPuzzle("easy"));
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);

  const isCorrect = selectedOption !== null && selectedOption === puzzle.answerIndex;

  const handleDifficultyChange = (nextDifficulty: MatrixDifficulty) => {
    setDifficulty(nextDifficulty);
    setPuzzle(generateMatrixPuzzle(nextDifficulty));
    setSelectedOption(null);
    setAttempts(0);
    setCorrect(0);
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);
    setAttempts((value) => value + 1);
    if (optionIndex === puzzle.answerIndex) setCorrect((value) => value + 1);
  };

  const nextPuzzle = () => {
    setPuzzle(generateMatrixPuzzle(difficulty));
    setSelectedOption(null);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <SEO
        title="Visual Matrix Practice | Sahadhyayi IQ Test"
        description="Practise original 3×3 visual matrix reasoning puzzles with fresh generated questions and explanations."
      />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link to="/brain" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to IQ Test
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-500"><BrainCircuit className="h-6 w-6" /></div>
            <div>
              <Badge variant="secondary">GENERATED PRACTICE</Badge>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Visual matrix reasoning</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Find the missing tile by identifying how shapes change across each row and column.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => handleDifficultyChange(event.target.value as MatrixDifficulty)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              aria-label="Puzzle difficulty"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-3 p-4"><Target className="h-5 w-5 text-violet-500" /><div><p className="text-xs text-muted-foreground">Difficulty</p><p className="font-semibold">{DIFFICULTY_LABELS[difficulty]}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Sparkles className="h-5 w-5 text-amber-500" /><div><p className="text-xs text-muted-foreground">Solved correctly</p><p className="font-semibold tabular-nums">{correct} / {attempts}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><RefreshCw className="h-5 w-5 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Puzzle supply</p><p className="font-semibold">Fresh puzzles each round</p></div></CardContent></Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Complete the 3 × 3 matrix</CardTitle>
                <CardDescription className="mt-1">Study the first eight tiles, then choose the option that completes the pattern.</CardDescription>
              </div>
              <Badge variant="outline">{puzzle.rule === "nested-growth" ? "Shape + size" : puzzle.rule === "combination" ? "Combination" : "Distribution"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mx-auto grid max-w-[570px] grid-cols-3 gap-2 sm:gap-3" aria-label="Eight puzzle tiles and one missing tile">
              {puzzle.cells.map((cell, index) => (
                <div
                  key={index}
                  className={`flex aspect-square items-center justify-center rounded-xl border p-2 sm:p-4 ${cell ? "border-border bg-muted/20 text-foreground" : "border-2 border-dashed border-violet-500 bg-violet-500/5 text-violet-500"}`}
                >
                  {cell ? <MatrixTile cell={cell} className="h-full w-full max-h-28 max-w-28" /> : <span className="text-4xl font-semibold" aria-label="Missing tile">?</span>}
                </div>
              ))}
            </div>

            <div className="mt-7">
              <h2 className="mb-3 text-sm font-semibold">Choose the missing tile</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
                {puzzle.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isAnswer = selectedOption !== null && index === puzzle.answerIndex;
                  const stateClass = isAnswer
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                    : isSelected
                      ? "border-rose-500 bg-rose-500/10 ring-1 ring-rose-500"
                      : "border-border hover:border-violet-500 hover:bg-violet-500/5";
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAnswer(index)}
                      disabled={selectedOption !== null}
                      aria-label={`Option ${String.fromCharCode(65 + index)}`}
                      aria-pressed={isSelected}
                      className={`relative flex aspect-square min-h-0 items-center justify-center rounded-xl border p-2 transition-colors disabled:cursor-default ${stateClass}`}
                    >
                      <span className="absolute left-2 top-1.5 text-[10px] font-semibold text-muted-foreground">{String.fromCharCode(65 + index)}</span>
                      <MatrixTile cell={option} className="h-full w-full max-h-20 max-w-20" />
                      {isAnswer && <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedOption !== null && (
              <div className={`mt-5 rounded-xl border p-4 ${isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`} role="status" aria-live="polite">
                <p className="flex items-center gap-2 font-semibold">
                  {isCorrect ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Target className="h-5 w-5 text-amber-600" />}
                  {isCorrect ? "That's correct!" : "Not quite — review the rule"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{puzzle.explanation}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={nextPuzzle}>Next puzzle <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => handleDifficultyChange(difficulty)}>Restart this difficulty</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>These are original practice puzzles, not official Raven test items. Your results are not an IQ score or clinical assessment.</p>
          <Button variant="ghost" size="sm" asChild><Link to="/brain/iq-test">Try the full reasoning assessment <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
        </div>
      </div>
    </main>
  );
}
