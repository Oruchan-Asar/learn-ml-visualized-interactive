import { describe, it, expect } from "vitest";
import {
  CLASS_A,
  CLASS_B,
  mean,
  withinClassScatter,
  totalWithinClassScatter,
  betweenClassScatter,
  ldaDirection,
} from "@/lib/math-core/linear-discriminant-analysis";

describe("class means", () => {
  it("computes clean integer means for both classes", () => {
    expect(mean(CLASS_A)).toEqual({ x: 2, y: 2 });
    expect(mean(CLASS_B)).toEqual({ x: 6, y: 4 });
  });
});

describe("within-class scatter", () => {
  it("class A spreads only along x", () => {
    expect(withinClassScatter(CLASS_A)).toEqual([
      [2, 0],
      [0, 0],
    ]);
  });

  it("class B spreads only along y", () => {
    expect(withinClassScatter(CLASS_B)).toEqual([
      [0, 0],
      [0, 2],
    ]);
  });

  it("the total within-class scatter S_W is a clean multiple of the identity", () => {
    expect(totalWithinClassScatter([CLASS_A, CLASS_B])).toEqual([
      [2, 0],
      [0, 2],
    ]);
  });
});

describe("between-class scatter", () => {
  it("is the outer product of the mean-difference vector (-4, -2)", () => {
    expect(betweenClassScatter(mean(CLASS_A), mean(CLASS_B))).toEqual([
      [16, 8],
      [8, 4],
    ]);
  });
});

describe("the LDA direction", () => {
  it("is exactly S_W^-1 (mean_A - mean_B) = (-2, -1)", () => {
    const dir = ldaDirection(CLASS_A, CLASS_B);
    expect(dir.x).toBeCloseTo(-2, 10);
    expect(dir.y).toBeCloseTo(-1, 10);
  });

  it("separates the two classes when points are projected (raw dot product) onto it", () => {
    const dir = ldaDirection(CLASS_A, CLASS_B);
    const rawProj = (p: { x: number; y: number }) => p.x * dir.x + p.y * dir.y;
    const projA = CLASS_A.map(rawProj);
    const projB = CLASS_B.map(rawProj);
    const meanProjA = (projA[0] + projA[1]) / 2;
    const meanProjB = (projB[0] + projB[1]) / 2;
    expect(meanProjA).toBeCloseTo(-6, 8);
    expect(meanProjB).toBeCloseTo(-16, 8);
    expect(Math.abs(meanProjA - meanProjB)).toBeGreaterThan(8);
  });
});
