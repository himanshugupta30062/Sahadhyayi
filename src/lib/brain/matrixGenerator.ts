/**
 * Brain Lab matrix puzzle generator.
 *
 * Adapted from the rule-based approach in:
 * https://github.com/jakopx-berg/matrix-reasoning-generator
 * Original project: MIT License, Copyright (c) 2026 Jakop Berg.
 * See THIRD_PARTY_NOTICES.md for the retained license notice.
 *
 * This module generates fresh original practice puzzles. It does not include
 * items, norms, answer keys, or scoring tables from commercial IQ tests.
 */

export type MatrixShape = "circle" | "square" | "triangle" | "diamond";
export type MatrixDifficulty = "easy" | "medium" | "hard";
export type MatrixRule = "distribution" | "combination" | "nested-growth";

export type MatrixLayer = {
  shape: MatrixShape;
  scale: number;
  filled?: boolean;
};

export type MatrixCell = {
  layers: MatrixLayer[];
};

export type MatrixPuzzle = {
  rule: MatrixRule;
  difficulty: MatrixDifficulty;
  cells: Array<MatrixCell | null>;
  options: MatrixCell[];
  answerIndex: number;
  explanation: string;
};

const SHAPES: MatrixShape[] = ["circle", "square", "triangle", "diamond"];
const INNER_SIZES = [0.3, 0.5, 0.72];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function uniqueShapes(): MatrixShape[] {
  return shuffle(SHAPES).slice(0, 3);
}

function cellKey(cell: MatrixCell): string {
  return cell.layers
    .map((layer) => `${layer.shape}:${layer.scale.toFixed(2)}:${layer.filled ? 1 : 0}`)
    .join("|");
}

function buildOptions(answer: MatrixCell): { options: MatrixCell[]; answerIndex: number } {
  const candidates: MatrixCell[] = [];

  for (const shape of SHAPES) {
    candidates.push({ layers: [{ shape, scale: 0.88, filled: false }] });
    candidates.push({ layers: [{ shape, scale: 0.88, filled: true }] });

    for (const inner of SHAPES) {
      if (inner === shape) continue;
      for (const scale of [0.3, 0.5, 0.72]) {
        candidates.push({
          layers: [
            { shape, scale: 0.88, filled: false },
            { shape: inner, scale, filled: false },
          ],
        });
      }
    }
  }

  const answerKey = cellKey(answer);
  const alternatives = shuffle(candidates.filter((cell) => cellKey(cell) !== answerKey));
  const options = shuffle([answer, ...alternatives.slice(0, 5)]);
  return { options, answerIndex: options.findIndex((cell) => cellKey(cell) === answerKey) };
}

function makePuzzle(
  rule: MatrixRule,
  difficulty: MatrixDifficulty,
  solvedGrid: MatrixCell[][],
  explanation: string,
): MatrixPuzzle {
  const answer = solvedGrid[2][2];
  const { options, answerIndex } = buildOptions(answer);
  const cells = solvedGrid.flat().map((cell, index) => (index === 8 ? null : cell));
  return { rule, difficulty, cells, options, answerIndex, explanation };
}

function generateDistribution(difficulty: MatrixDifficulty): MatrixPuzzle {
  const outer = uniqueShapes();
  const inner = uniqueShapes();
  const usesInner = difficulty !== "easy";
  const grid: MatrixCell[][] = [];

  for (let row = 0; row < 3; row += 1) {
    const rowCells: MatrixCell[] = [];
    for (let column = 0; column < 3; column += 1) {
      const layers: MatrixLayer[] = [
        { shape: outer[(row + column) % 3], scale: 0.88, filled: false },
      ];
      if (usesInner) {
        layers.push({
          shape: inner[(row + 2 * column) % 3],
          scale: difficulty === "hard" ? 0.54 : 0.4,
          filled: false,
        });
      }
      rowCells.push({ layers });
    }
    grid.push(rowCells);
  }

  const explanation = usesInner
    ? "The outer shapes and the smaller inner shapes each follow their own once-per-row-and-column distribution. The missing tile uses the shapes absent from the final row and column."
    : "Each row and column contains each of the three outer shapes exactly once. Choose the shape missing from the bottom row and rightmost column.";

  return makePuzzle("distribution", difficulty, grid, explanation);
}

function generateCombination(difficulty: MatrixDifficulty): MatrixPuzzle {
  const grid: MatrixCell[][] = [];
  for (let row = 0; row < 3; row += 1) {
    const [outer, inner] = shuffle(SHAPES).slice(0, 2);
    const innerScale = difficulty === "easy" ? 0.36 : difficulty === "medium" ? 0.46 : 0.56;
    grid.push([
      { layers: [{ shape: outer, scale: 0.88, filled: false }] },
      { layers: [{ shape: inner, scale: 0.88, filled: false }] },
      {
        layers: [
          { shape: outer, scale: 0.88, filled: false },
          { shape: inner, scale: innerScale, filled: false },
        ],
      },
    ]);
  }
  return makePuzzle(
    "combination",
    difficulty,
    grid,
    "In each row, the third tile combines the large outline from the first tile with a smaller version of the second tile inside it.",
  );
}

function generateNestedGrowth(difficulty: MatrixDifficulty): MatrixPuzzle {
  const outer = uniqueShapes();
  const inner = uniqueShapes();
  const sizes = difficulty === "easy" ? [0.32, 0.42, 0.56] : INNER_SIZES;
  const grid: MatrixCell[][] = [];

  for (let row = 0; row < 3; row += 1) {
    const rowCells: MatrixCell[] = [];
    for (let column = 0; column < 3; column += 1) {
      rowCells.push({
        layers: [
          { shape: outer[(row + column) % 3], scale: 0.88, filled: false },
          { shape: inner[row], scale: sizes[column], filled: false },
        ],
      });
    }
    grid.push(rowCells);
  }

  return makePuzzle(
    "nested-growth",
    difficulty,
    grid,
    "The outer shape follows a once-per-row-and-column distribution. Within each row, the inner shape stays the same but grows from left to right; the missing tile needs the remaining outer shape and the largest inner shape.",
  );
}

export function generateMatrixPuzzle(difficulty: MatrixDifficulty = "easy"): MatrixPuzzle {
  const availableRules: MatrixRule[] =
    difficulty === "easy"
      ? ["distribution", "combination"]
      : ["distribution", "combination", "nested-growth"];
  const rule = availableRules[Math.floor(Math.random() * availableRules.length)];

  switch (rule) {
    case "combination":
      return generateCombination(difficulty);
    case "nested-growth":
      return generateNestedGrowth(difficulty);
    default:
      return generateDistribution(difficulty);
  }
}

/** Stable structural key useful for validating generated answer choices. */
export function matrixCellKey(cell: MatrixCell): string {
  return cellKey(cell);
}
