import { describe, it, expect } from "vitest";
import {
  roundToSigFigs,
  toToyFp16,
  recoveredGradient,
  fp16OnlyAfterSteps,
  fp32MasterAfterSteps,
  G_RAW,
  MASTER_WEIGHT,
  TINY_UPDATE,
  NUM_STEPS,
  TARGET_SCALE,
} from "@/lib/math-core/mixed-precision-training";

describe("the toy low-precision format rounds to a few significant digits and flushes tiny values to zero", () => {
  it("roundToSigFigs(123.456, 3) = 123", () => {
    expect(roundToSigFigs(123.456, 3)).toBe(123);
  });

  it("roundToSigFigs(1.234567, 3) = 1.23", () => {
    expect(roundToSigFigs(1.234567, 3)).toBeCloseTo(1.23, 10);
  });

  it("a value below the floor underflows to exactly 0", () => {
    expect(toToyFp16(G_RAW)).toBe(0);
  });
});

describe("loss scaling rescues a small gradient from underflowing", () => {
  it("scale = 1 (no scaling): the true gradient underflows and is lost entirely", () => {
    expect(recoveredGradient(1)).toBe(0);
  });

  it("scale = TARGET_SCALE lifts the gradient just above the floor and recovers it exactly", () => {
    expect(recoveredGradient(TARGET_SCALE)).toBeCloseTo(G_RAW, 12);
  });

  it("larger scales (up to 8) also recover the true gradient exactly", () => {
    expect(recoveredGradient(8)).toBeCloseTo(G_RAW, 12);
  });
});

describe("an fp16-only weight can't accumulate updates smaller than its own precision", () => {
  it("a fp16-only weight stalls at 1.23 and never moves, step after step", () => {
    expect(fp16OnlyAfterSteps(1)).toBeCloseTo(1.23, 10);
    expect(fp16OnlyAfterSteps(NUM_STEPS)).toBeCloseTo(1.23, 10);
  });

  it("a fp32 master copy accumulates every tiny update exactly", () => {
    expect(fp32MasterAfterSteps(NUM_STEPS)).toBeCloseTo(MASTER_WEIGHT + NUM_STEPS * TINY_UPDATE, 10);
    expect(fp32MasterAfterSteps(NUM_STEPS)).toBeCloseTo(1.233567, 6);
  });

  it("after enough steps, the fp32 master value has clearly diverged from the fp16-only value", () => {
    const gap = Math.abs(fp32MasterAfterSteps(NUM_STEPS) - fp16OnlyAfterSteps(NUM_STEPS));
    expect(gap).toBeGreaterThan(0.002);
  });
});
