import { describe, expect, it } from "vitest";
import {
  generateMatrixPuzzle,
  matrixCellKey,
  type MatrixDifficulty,
} from "./matrixGenerator";

const difficulties: MatrixDifficulty[] = ["easy", "medium", "hard"];

describe("generateMatrixPuzzle", () => {
  it.each(difficulties)("creates valid %s puzzles with one missing cell and six unique options", (difficulty) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const puzzle = generateMatrixPuzzle(difficulty);
      expect(puzzle.difficulty).toBe(difficulty);
      expect(puzzle.cells).toHaveLength(9);
      expect(puzzle.cells[8]).toBeNull();
      expect(puzzle.cells.slice(0, 8).every(Boolean)).toBe(true);
      expect(puzzle.options).toHaveLength(6);
      expect(puzzle.answerIndex).toBeGreaterThanOrEqual(0);
      expect(puzzle.answerIndex).toBeLessThan(6);
      expect(new Set(puzzle.options.map(matrixCellKey)).size).toBe(6);
    }
  });

  it("uses only the simpler rule families in easy mode", () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      expect(["distribution", "combination"]).toContain(generateMatrixPuzzle("easy").rule);
    }
  });

  it("places the distribution answer outside the visible bottom-row and right-column values", () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const puzzle = generateMatrixPuzzle("medium");
      if (puzzle.rule !== "distribution") continue;
      const bottomLeft = puzzle.cells[6]!;
      const bottomMiddle = puzzle.cells[7]!;
      const topRight = puzzle.cells[2]!;
      const middleRight = puzzle.cells[5]!;
      const answer = puzzle.options[puzzle.answerIndex];
      const outer = answer.layers[0].shape;
      expect([bottomLeft.layers[0].shape, bottomMiddle.layers[0].shape]).not.toContain(outer);
      expect([topRight.layers[0].shape, middleRight.layers[0].shape]).not.toContain(outer);
      expect(answer.layers).toHaveLength(2);
      const inner = answer.layers[1].shape;
      expect([bottomLeft.layers[1].shape, bottomMiddle.layers[1].shape]).not.toContain(inner);
      expect([topRight.layers[1].shape, middleRight.layers[1].shape]).not.toContain(inner);
    }
  });

  it("builds the combination answer from the first two cells in the missing row", () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const puzzle = generateMatrixPuzzle("easy");
      if (puzzle.rule !== "combination") continue;
      const answer = puzzle.options[puzzle.answerIndex];
      expect(answer.layers[0].shape).toBe(puzzle.cells[6]!.layers[0].shape);
      expect(answer.layers[1].shape).toBe(puzzle.cells[7]!.layers[0].shape);
    }
  });

  it("increases the inner shape from left to right in nested-growth puzzles", () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const puzzle = generateMatrixPuzzle("medium");
      if (puzzle.rule !== "nested-growth") continue;
      const answer = puzzle.options[puzzle.answerIndex];
      expect(answer.layers[0].shape).not.toBe(puzzle.cells[6]!.layers[0].shape);
      expect(answer.layers[0].shape).not.toBe(puzzle.cells[7]!.layers[0].shape);
      expect(answer.layers[1].shape).toBe(puzzle.cells[6]!.layers[1].shape);
      expect(answer.layers[1].scale).toBeGreaterThan(puzzle.cells[7]!.layers[1].scale);
    }
  });
  it("combines shape distribution with alternating fill in the new rule family", () => {
    let observed = false;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const puzzle = generateMatrixPuzzle("hard");
      if (puzzle.rule !== "fill-alternation") continue;
      observed = true;
      const answer = puzzle.options[puzzle.answerIndex];
      const visibleShapes = [puzzle.cells[6]!, puzzle.cells[7]!, puzzle.cells[2]!, puzzle.cells[5]!]
        .map((cell) => cell.layers[0].shape);
      expect(visibleShapes).not.toContain(answer.layers[0].shape);
      expect(answer.layers).toHaveLength(1);
      expect(answer.layers[0].filled).toBe(true);
      expect(puzzle.cells[6]!.layers[0].filled).toBe(true);
      expect(puzzle.cells[7]!.layers[0].filled).toBe(false);
      expect(puzzle.cells[2]!.layers[0].filled).toBe(true);
      expect(puzzle.cells[5]!.layers[0].filled).toBe(false);
    }
    expect(observed).toBe(true);
  });

});
