import { describe, expect, it } from "vitest";
import {
  WORDS,
  findWord,
  nearestNeighbor,
  nearestWordToPoint,
  analogy,
  ANALOGY_A,
  ANALOGY_B,
  ANALOGY_C,
  ANALOGY_ANSWER,
} from "@/lib/math-core/word-embeddings";

describe("nearest neighbors in the toy embedding space", () => {
  it("king's nearest neighbor is prince, not queen", () => {
    expect(nearestNeighbor(findWord("king")).label).toBe("prince");
  });

  it("queen's nearest neighbor is princess", () => {
    expect(nearestNeighbor(findWord("queen")).label).toBe("princess");
  });

  it("man's nearest neighbors are prince and woman, tied at distance 2", () => {
    const man = findWord("man");
    const others = WORDS.filter((w) => w.label !== "man");
    const dists = others.map((w) => Math.hypot(man.x - w.x, man.y - w.y));
    expect(Math.min(...dists)).toBeCloseTo(2, 10);
  });
});

describe("analogy arithmetic: king - man + woman", () => {
  it("lands exactly on queen's coordinates", () => {
    const result = analogy(findWord(ANALOGY_A), findWord(ANALOGY_B), findWord(ANALOGY_C));
    const queen = findWord(ANALOGY_ANSWER);
    expect(result.x).toBeCloseTo(queen.x, 10);
    expect(result.y).toBeCloseTo(queen.y, 10);
  });

  it("the nearest word to the analogy result is queen, not any other word", () => {
    const result = analogy(findWord(ANALOGY_A), findWord(ANALOGY_B), findWord(ANALOGY_C));
    expect(nearestWordToPoint(result).label).toBe(ANALOGY_ANSWER);
  });

  it("prince - man + woman lands on princess, by the same royalty/gender geometry", () => {
    const result = analogy(findWord("prince"), findWord("man"), findWord("woman"));
    const princess = findWord("princess");
    expect(result.x).toBeCloseTo(princess.x, 10);
    expect(result.y).toBeCloseTo(princess.y, 10);
  });
});
