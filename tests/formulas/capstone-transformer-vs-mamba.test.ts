import { describe, it, expect } from "vitest";
import {
  buildSequence,
  selectiveRecall,
  transformerCost,
  mambaCost,
  transformerMemory,
  mambaMemory,
  CANDIDATE_LENGTHS,
  SIGNAL_POSITION,
  SIGNAL_VALUE,
} from "@/lib/math-core/capstone-transformer-vs-mamba";

describe("buildSequence", () => {
  it("places the signal at the given position and fills everywhere else with zero", () => {
    const seq = buildSequence(8);
    expect(seq).toHaveLength(8);
    expect(seq[SIGNAL_POSITION]).toBe(SIGNAL_VALUE);
    expect(seq.filter((_, i) => i !== SIGNAL_POSITION).every((x) => x === 0)).toBe(true);
  });
});

describe("selectiveRecall", () => {
  it("recovers the exact planted signal at every candidate sequence length", () => {
    for (const n of CANDIDATE_LENGTHS) {
      expect(selectiveRecall(buildSequence(n))).toBe(SIGNAL_VALUE);
    }
  });

  it("still recovers it when the signal sits at a different position", () => {
    const seq = buildSequence(20, 15, -4);
    expect(selectiveRecall(seq)).toBe(-4);
  });
});

describe("cost functions", () => {
  it("transformerCost matches n² × D_MODEL for every candidate length", () => {
    expect(CANDIDATE_LENGTHS.map((n) => transformerCost(n))).toEqual([512, 2048, 8192, 32768, 131072]);
  });

  it("mambaCost matches n exactly", () => {
    expect(CANDIDATE_LENGTHS.map((n) => mambaCost(n))).toEqual(CANDIDATE_LENGTHS);
  });

  it("the smallest candidate length where transformer cost clears 10,000 ops is 64", () => {
    const first = CANDIDATE_LENGTHS.find((n) => transformerCost(n) >= 10000);
    expect(first).toBe(64);
  });
});

describe("memory functions", () => {
  it("transformer memory grows with n; mamba memory stays at 1 regardless of n", () => {
    for (const n of CANDIDATE_LENGTHS) {
      expect(transformerMemory(n)).toBe(n);
      expect(mambaMemory()).toBe(1);
    }
  });

  it("at n=128, the transformer needs 128x the memory for the exact same correct answer", () => {
    expect(transformerMemory(128) / mambaMemory()).toBe(128);
  });
});
