export interface ReadingDna {
  user_id: string;
  genres: Array<{ name: string; weight: number }>;
  moods: string[];
  pace: string | null;
  themes: string[];
  summary: string | null;
  signature_color: string | null;
  generated_at: string;
}

const norm = (s: string) => s.trim().toLowerCase();

export const genreOverlap = (a: ReadingDna, b: ReadingDna): number => {
  const am = new Map(a.genres.map((g) => [norm(g.name), g.weight]));
  const bm = new Map(b.genres.map((g) => [norm(g.name), g.weight]));
  let inter = 0;
  let union = 0;
  const keys = new Set([...am.keys(), ...bm.keys()]);
  keys.forEach((k) => {
    const av = am.get(k) ?? 0;
    const bv = bm.get(k) ?? 0;
    inter += Math.min(av, bv);
    union += Math.max(av, bv);
  });
  return union === 0 ? 0 : inter / union;
};

const setOverlap = (a: string[], b: string[]): number => {
  if (!a.length || !b.length) return 0;
  const A = new Set(a.map(norm));
  const B = new Set(b.map(norm));
  let inter = 0;
  A.forEach((v) => {
    if (B.has(v)) inter += 1;
  });
  return inter / Math.max(A.size, B.size);
};

export const matchScore = (a: ReadingDna | null, b: ReadingDna | null): number => {
  if (!a || !b) return 0;
  const g = genreOverlap(a, b);
  const m = setOverlap(a.moods, b.moods);
  const t = setOverlap(a.themes, b.themes);
  const p = norm(a.pace ?? "") && norm(a.pace ?? "") === norm(b.pace ?? "") ? 1 : 0;
  // weights: genres 0.45, moods 0.25, themes 0.2, pace 0.1
  const raw = g * 0.45 + m * 0.25 + t * 0.2 + p * 0.1;
  return Math.round(raw * 100);
};
